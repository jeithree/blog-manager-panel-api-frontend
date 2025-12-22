import prisma from '../prisma.ts';
import {PostStatus} from '@prisma/client';
import RedisCache from '../lib/redisCache.ts';
import * as netlifyService from './netlifyService.ts';
import * as Logger from '../helpers/logger.ts';
import type {
	CreatePostDto,
	GetPostsQueryDto,
	UpdatePostDto,
} from '../types/post.ts';
import {
	BadRequestError,
	NotFoundError,
	UnauthorizedError,
} from '../lib/appError.ts';
import * as R2Service from './R2Service.ts';

export const createPost = async (
	userId: string,
	postData: CreatePostDto,
	file: Express.Multer.File | undefined
) => {
	const blog = await prisma.blog.findFirst({
		where: {
			id: postData.blogId,
			userId: userId,
		},
	});

	if (!blog) {
		throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
	}

	const category = await prisma.category.findFirst({
		where: {id: postData.categoryId, blogId: postData.blogId},
	});

	if (!category) {
		throw new NotFoundError('Category not found', 'CATEGORY_NOT_FOUND');
	}

	const author = await prisma.author.findFirst({
		where: {id: postData.authorId, blogId: postData.blogId},
	});

	if (!author) {
		throw new NotFoundError('Author not found', 'AUTHOR_NOT_FOUND');
	}

	const tagIds = postData.tagIds ?? [];
	if (tagIds.length) {
		const tags = await prisma.tag.findMany({
			where: {id: {in: tagIds}, blogId: postData.blogId},
		});

		if (tags.length !== tagIds.length) {
			throw new BadRequestError(
				'One or more tags are invalid for this blog',
				'INVALID_TAGS'
			);
		}
	}

	// upload image to R2
	let imageUrl = null;
	if (postData.imageUrl && file) {
		imageUrl = await R2Service.uploadImageToR2(
			blog.R2BucketName,
			file.buffer,
			`blog/images/${postData.imageUrl}`
		);
		if (imageUrl) {
			imageUrl = `${blog.R2CustomDomain}/${imageUrl}`;
		}
	}

	const post = await prisma.post.create({
		data: {
			title: postData.title,
			description: postData.description,
			slug: postData.slug,
			imageUrl: imageUrl,
			content: postData.content,
			categoryId: category.id,
			authorId: author.id,
			blogId: blog.id,
			tags: tagIds.length
				? {
						connect: tagIds.map((id) => ({id})),
				  }
				: undefined,
		},
		include: {
			category: true,
			author: true,
			tags: true,
		},
	});

	await RedisCache.deleteByPattern(`public:posts:${blog.id}:*`);
	await RedisCache.deleteByPattern(`public:post:${blog.id}:*`);

	return post;
};

export const updatePost = async (
	userId: string,
	postId: string,
	postData: UpdatePostDto,
	file: Express.Multer.File | undefined
) => {
	const {blogId, tagIds, publishedAt, ...fields} = postData;

	const blog = await prisma.blog.findFirst({
		where: {
			id: blogId,
			userId,
		},
		select: {
			id: true,
			title: true,
			netlifySiteId: true,
			R2BucketName: true,
			R2CustomDomain: true,
		},
	});

	if (!blog) {
		throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
	}

	const post = await prisma.post.findFirst({
		where: {id: postId, blogId},
		include: {tags: true},
	});

	if (!post) {
		throw new NotFoundError('Post not found', 'POST_NOT_FOUND');
	}

	if (fields.categoryId) {
		const category = await prisma.category.findFirst({
			where: {id: fields.categoryId, blogId},
		});

		if (!category) {
			throw new NotFoundError('Category not found', 'CATEGORY_NOT_FOUND');
		}
	}

	if (fields.authorId) {
		const author = await prisma.author.findFirst({
			where: {id: fields.authorId, blogId},
		});

		if (!author) {
			throw new NotFoundError('Author not found', 'AUTHOR_NOT_FOUND');
		}
	}

	if (tagIds !== undefined) {
		if (tagIds.length) {
			const tags = await prisma.tag.findMany({
				where: {id: {in: tagIds}, blogId},
			});

			if (tags.length !== tagIds.length) {
				throw new BadRequestError(
					'One or more tags are invalid for this blog',
					'INVALID_TAGS'
				);
			}
		}
	}

	const nextTitle = fields.title ?? post.title;
	const nextDescription = fields.description ?? post.description;
	const nextSlug = fields.slug ?? post.slug;
	const nextContent = fields.content ?? post.content;
	const nextCategoryId = fields.categoryId ?? post.categoryId;
	const nextAuthorId = fields.authorId ?? post.authorId;
	const nextStatus = fields.status ?? post.status;
	const nextImageUrl = fields.imageUrl ?? post.imageUrl;
	const nextPublishedAt = publishedAt ?? post.publishedAt;
	const nextTagsCount = tagIds !== undefined ? tagIds.length : post.tags.length;
	const wasPublished = post.status === PostStatus.PUBLISHED;
	if (
		post.status === PostStatus.PUBLISHED &&
		nextStatus !== PostStatus.PUBLISHED
	) {
		throw new BadRequestError(
			'Cannot change a published post back to draft or scheduled',
			'INVALID_STATUS_TRANSITION'
		);
	}

	if (
		nextStatus === PostStatus.SCHEDULED ||
		nextStatus === PostStatus.PUBLISHED
	) {
		const missing: string[] = [];
		if (!nextTitle?.trim()) missing.push('title');
		if (!nextDescription?.trim()) missing.push('description');
		if (!nextSlug?.trim()) missing.push('slug');
		if (!nextContent?.trim()) missing.push('content');
		if (!nextCategoryId) missing.push('categoryId');
		if (!nextAuthorId) missing.push('authorId');
		if (!nextImageUrl?.trim()) missing.push('imageUrl');
		if (nextTagsCount === 0) missing.push('tags');

		if (missing.length) {
			throw new BadRequestError(
				`Cannot ${nextStatus.toLowerCase()} post; missing fields: ${missing.join(
					', '
				)}`,
				'MISSING_FIELDS_FOR_PUBLISH'
			);
		}

		if (nextStatus === PostStatus.SCHEDULED) {
			if (!nextPublishedAt) {
				throw new BadRequestError(
					'publishedAt is required when scheduling a post',
					'PUBLISHED_AT_REQUIRED'
				);
			}
			if (nextPublishedAt <= new Date()) {
				throw new BadRequestError(
					'publishedAt must be in the future for scheduled posts',
					'PUBLISHED_AT_IN_PAST'
				);
			}
		}
	}

	// upload image to R2
	let imageUrl = null;
	if (fields.imageUrl && file) {
		imageUrl = await R2Service.uploadImageToR2(
			blog.R2BucketName,
			file.buffer,
			`blog/images/${fields.imageUrl}`
		);
		if (imageUrl) {
			imageUrl = `${blog.R2CustomDomain}/${imageUrl}`;
			// delete old image from R2
			if (post.imageUrl) {
				await R2Service.deleteImageFromR2(
					blog.R2BucketName,
					post.imageUrl.replace(`${blog.R2CustomDomain}/`, '')
				);
			}
		}
	}

	const updateData = {
		...(fields.title ? {title: fields.title} : {}),
		...(fields.description ? {description: fields.description} : {}),
		...(fields.slug ? {slug: fields.slug} : {}),
		...(imageUrl ? {imageUrl: imageUrl} : {}),
		...(fields.content ? {content: fields.content} : {}),
		...(fields.categoryId ? {categoryId: fields.categoryId} : {}),
		...(fields.authorId ? {authorId: fields.authorId} : {}),
		...(fields.status ? {status: fields.status} : {}),
		...(publishedAt !== undefined ? {publishedAt} : {}),
		...(fields.status === PostStatus.PUBLISHED && !publishedAt
			? {publishedAt: new Date()}
			: {}),
		...(fields.status === PostStatus.DRAFT ? {publishedAt: null} : {}),
		...(tagIds !== undefined
			? {
					// Overwrite tag relationships when provided
					tags: {set: tagIds.map((id) => ({id}))},
			  }
			: {}),
	};

	const updatedPost = await prisma.post.update({
		where: {id: postId},
		data: updateData,
		include: {
			category: true,
			author: true,
			tags: true,
		},
	});

	await RedisCache.deleteByPattern(`public:posts:${blogId}:*`);
	await RedisCache.deleteByPattern(`public:post:${blogId}:*`);

	const willPublish = nextStatus === PostStatus.PUBLISHED && !wasPublished;
	if (willPublish && blog.netlifySiteId) {
		try {
			const deploy = await netlifyService.triggerRebuild(blog.netlifySiteId);
			await netlifyService.waitForDeploy(deploy.id);
			Logger.logToConsole(
				`Post publish triggered Netlify deploy (site: ${blog.netlifySiteId}, deploy: ${deploy.id})`
			);
		} catch (error) {
			Logger.logToConsole(
				`Netlify deploy failed after publishing post ${postId}: ${String(
					error
				)}`
			);
			await Logger.logToFile(error, 'error');
			throw new BadRequestError(
				'Failed to trigger site deploy after publishing the post',
				'DEPLOY_FAILED'
			);
		}
	}

	return updatedPost;
};

export const getPosts = async (
	userId: string,
	{blogId, categoryId, tagId, status, page = 1, pageSize = 10}: GetPostsQueryDto
) => {
	if (page < 1 || pageSize < 1) {
		throw new BadRequestError(
			'Page and page size must be positive',
			'INVALID_PAGINATION'
		);
	}

	const blog = await prisma.blog.findFirst({
		where: {
			id: blogId,
			userId,
		},
	});

	if (!blog) {
		throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
	}

	const where = {
		blogId,
		...(categoryId ? {categoryId} : {}),
		...(tagId
			? {
					tags: {
						some: {id: tagId},
					},
			  }
			: {}),
		...(status ? {status} : {}),
	};

	const total = await prisma.post.count({where});
	const posts = await prisma.post.findMany({
		where,
		include: {
			category: true,
			author: true,
			tags: true,
		},
		orderBy: {createdAt: 'desc'},
		skip: (page - 1) * pageSize,
		take: pageSize,
	});

	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	return {
		items: posts,
		total,
		page,
		pageSize,
		totalPages,
	};
};

export const getPostById = async (
	userId: string,
	blogId: string,
	postId: string
) => {
	const blog = await prisma.blog.findFirst({
		where: {id: blogId, userId},
	});

	if (!blog) {
		throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
	}

	const post = await prisma.post.findFirst({
		where: {id: postId, blogId},
		include: {
			category: true,
			author: true,
			tags: true,
		},
	});

	if (!post) {
		throw new NotFoundError('Post not found', 'POST_NOT_FOUND');
	}

	return post;
};

// Public Service Functions

export const getPublicPosts = async (
	apikey: string,
	{blogId, categoryId, tagId, page = 1, pageSize = 10}: GetPostsQueryDto
) => {
	if (page < 1 || pageSize < 1) {
		throw new BadRequestError(
			'Page and page size must be positive',
			'INVALID_PAGINATION'
		);
	}

	if (!blogId) {
		throw new BadRequestError('Blog ID is required', 'BLOG_ID_REQUIRED');
	}

	const blog = await prisma.blog.findFirst({
		where: {id: blogId, apiKey: apikey},
	});

	if (!blog) {
		throw new UnauthorizedError(
			'Invalid API key for this blog',
			'INVALID_API_KEY'
		);
	}

	const cacheKey = `public:posts:${blogId}:${categoryId ?? 'all'}:${
		tagId ?? 'all'
	}:${page}:${pageSize}`;
	const cached = await RedisCache.get(cacheKey);
	if (cached) return cached;

	const where = {
		blogId,
		status: PostStatus.PUBLISHED,
		...(categoryId ? {categoryId} : {}),
		...(tagId
			? {
					tags: {
						some: {id: tagId},
					},
			  }
			: {}),
	};

	const total = await prisma.post.count({where});
	const posts = await prisma.post.findMany({
		where,
		include: {
			category: true,
			author: true,
			tags: true,
		},
		orderBy: {createdAt: 'desc'},
		skip: (page - 1) * pageSize,
		take: pageSize,
	});

	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	const result = {
		items: posts,
		total,
		page,
		pageSize,
		totalPages,
	};

	await RedisCache.set(cacheKey, result);

	return result;
};

export const getPublicPostBySlug = async (
	apikey: string,
	blogId: string,
	slug: string | undefined
) => {
	if (!slug) {
		throw new BadRequestError('Post slug is required', 'POST_SLUG_REQUIRED');
	}

	const blog = await prisma.blog.findFirst({
		where: {id: blogId, apiKey: apikey},
	});

	if (!blog) {
		throw new UnauthorizedError(
			'Invalid API key for this blog',
			'INVALID_API_KEY'
		);
	}

	const cacheKey = `public:post:${blogId}:${slug}`;
	const cached = await RedisCache.get(cacheKey);
	if (cached) return cached;

	const post = await prisma.post.findFirst({
		where: {slug, blogId, status: PostStatus.PUBLISHED},
		include: {
			category: true,
			author: true,
			tags: true,
		},
	});

	if (!post) {
		throw new NotFoundError('Post not found', 'POST_NOT_FOUND');
	}

	await RedisCache.set(cacheKey, post);

	return post;
};
