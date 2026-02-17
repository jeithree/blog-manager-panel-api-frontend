import crypto from 'node:crypto';
import prisma from '../prisma.ts';
import RedisCache from '../lib/redisCache.ts';
import type {CreateBlogDto, UpdateBlogDto} from '../types/blog.ts';
import {
	BadRequestError,
	NotFoundError,
	UnauthorizedError,
} from '../lib/appError.ts';

export const createBlog = async (userId: string, blogData: CreateBlogDto) => {
	const apiKey = crypto.randomBytes(32).toString('hex');

	// Create the blog and add the creating user as OWNER in BlogMember
	const newBlog = await prisma.blog.create({
		data: {
			...blogData,
			userId: userId,
			apiKey,
			members: {
				create: {
					userId,
					role: 'OWNER',
				},
			},
		},
	});

	await RedisCache.deleteByPattern(`public:blog:${newBlog.id}*`);
	await RedisCache.deleteByPattern(`public:posts:${newBlog.id}:*`);
	await RedisCache.deleteByPattern(`public:categories:${newBlog.id}*`);
	await RedisCache.deleteByPattern(`public:tags:${newBlog.id}*`);

	return {
		...newBlog,
		netlifyToken: newBlog.netlifyToken ? '••••••••••••' : null,
		R2SecretAccessKey: newBlog.R2SecretAccessKey ? '••••••••••••' : null,
		openAIApiKey: newBlog.openAIApiKey ? '••••••••••••' : null,
	};
};

export const updateBlog = async (
	userId: string,
	blogId: string | undefined,
	blogData: UpdateBlogDto,
) => {
	if (!blogId) {
		throw new BadRequestError('Blog ID is required', 'BLOG_ID_REQUIRED');
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

	// Remove masked credential values to prevent overwriting actual credentials
	const MASKED_VALUE = '••••••••••••';
	const updateData = {...blogData};

	if (updateData.netlifyToken === MASKED_VALUE) {
		delete updateData.netlifyToken;
	}
	if (updateData.R2SecretAccessKey === MASKED_VALUE) {
		delete updateData.R2SecretAccessKey;
	}
	if (updateData.openAIApiKey === MASKED_VALUE) {
		delete updateData.openAIApiKey;
	}

	const updatedBlog = await prisma.blog.update({
		where: {id: blogId},
		data: updateData,
	});

	await RedisCache.deleteByPattern(`public:blog:${blogId}*`);
	await RedisCache.deleteByPattern(`public:posts:${blogId}:*`);
	await RedisCache.deleteByPattern(`public:categories:${blogId}*`);
	await RedisCache.deleteByPattern(`public:tags:${blogId}*`);

	return {
		...updatedBlog,
		netlifyToken: updatedBlog.netlifyToken ? '••••••••••••' : null,
		R2SecretAccessKey: updatedBlog.R2SecretAccessKey ? '••••••••••••' : null,
		openAIApiKey: updatedBlog.openAIApiKey ? '••••••••••••' : null,
	};
};

export const getBlogs = async (userId: string) => {
	const blogs = await prisma.blog.findMany({
		where: {
			OR: [{userId}, {members: {some: {userId}}}],
		},
		orderBy: {
			createdAt: 'desc',
		},
	});

	return blogs.map((blog) => ({
		...blog,
		netlifyToken: blog.netlifyToken ? '••••••••••••' : null,
		R2SecretAccessKey: blog.R2SecretAccessKey ? '••••••••••••' : null,
		openAIApiKey: blog.openAIApiKey ? '••••••••••••' : null,
	}));
};

export const getBlog = async (userId: string, blogId?: string) => {
	if (!blogId) {
		throw new BadRequestError('Blog ID is required', 'BLOG_ID_REQUIRED');
	}

	const blog = await prisma.blog.findFirst({
		where: {
			id: blogId,
			OR: [{userId}, {members: {some: {userId}}}],
		},
		include: {
			categories: true,
			tags: true,
			authors: true,
		},
	});

	if (!blog) {
		throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
	}

	return {
		...blog,
		netlifyToken: blog.netlifyToken ? '••••••••••••' : null,
		R2SecretAccessKey: blog.R2SecretAccessKey ? '••••••••••••' : null,
		openAIApiKey: blog.openAIApiKey ? '••••••••••••' : null,
	};
};

// Public Service

export const getPublicBlog = async (apiKey: string, blogId?: string) => {
	if (!blogId) {
		throw new BadRequestError('Blog ID is required', 'BLOG_ID_REQUIRED');
	}

	const cacheKey = `public:blog:${blogId}`;
	const cached = await RedisCache.get(cacheKey);
	if (cached) return cached;

	const blog = await prisma.blog.findFirst({
		where: {
			id: blogId,
			apiKey,
		},
		select: {
			id: true,
			title: true,
			domain: true,
			description: true,
			categories: true,
			tags: true,
			authors: true,
		},
	});

	if (!blog) {
		throw new UnauthorizedError(
			'Invalid API key for this blog',
			'INVALID_API_KEY',
		);
	}

	await RedisCache.set(cacheKey, blog);
	return blog;
};
