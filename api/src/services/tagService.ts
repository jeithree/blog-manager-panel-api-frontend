import prisma from '../prisma.ts';
import RedisCache from '../lib/redisCache.ts';
import type {CreateTagDto} from '../types/tag.ts';
import {NotFoundError, UnauthorizedError} from '../lib/appError.ts';

export const createTag = async (userId: string, tagData: CreateTagDto) => {
	const blog = await prisma.blog.findFirst({
		where: {
			id: tagData.blogId,
			userId: userId,
		},
	});

	if (!blog) {
		throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
	}

	const newTag = await prisma.tag.create({
		data: {
			...tagData,
		},
	});

	await RedisCache.deleteByPattern(`public:tags:${tagData.blogId}*`);

	return newTag;
};

export const getTags = async (userId: string, blogId: string) => {
	const blog = await prisma.blog.findFirst({
		where: {
			id: blogId,
			OR: [
				{userId},
				{
					members: {
						some: {
							userId,
						},
					},
				},
			],
		},
		include: {
			tags: true,
		},
	});

	if (!blog) {
		throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
	}

	return blog.tags;
};

// Public Service

export const getPublicTags = async (apiKey: string, blogId: string) => {
	const cacheKey = `public:tags:${blogId}`;
	const cached = await RedisCache.get(cacheKey);
	if (cached) return cached;

	const blog = await prisma.blog.findFirst({
		where: {
			id: blogId,
			apiKey: apiKey,
		},
		include: {
			tags: true,
		},
	});

	if (!blog) {
		throw new UnauthorizedError(
			'Invalid API key for this blog',
			'INVALID_API_KEY'
		);
	}

	await RedisCache.set(cacheKey, blog.tags);

	return blog.tags;
};
