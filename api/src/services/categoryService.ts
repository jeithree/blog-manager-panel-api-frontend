import prisma from '../prisma.ts';
import RedisCache from '../lib/redisCache.ts';
import type {CreateCategoryDto} from '../types/category.ts';
import {NotFoundError, UnauthorizedError} from '../lib/appError.ts';

export const createCategory = async (
	userId: string,
	categoryData: CreateCategoryDto
) => {
	const blog = await prisma.blog.findFirst({
		where: {
			id: categoryData.blogId,
			userId: userId,
		},
	});

	if (!blog) {
		throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
	}

	const newCategory = await prisma.category.create({
		data: {
			...categoryData,
		},
	});

	await RedisCache.deleteByPattern(`public:categories:${categoryData.blogId}*`);
	return newCategory;
};

export const getCategories = async (userId: string, blogId: string) => {
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
			categories: true,
		},
	});

	if (!blog) {
		throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
	}

	return blog.categories;
};

// Public Service

export const getPublicCategories = async (apiKey: string, blogId: string) => {
	const cacheKey = `public:categories:${blogId}`;
	const cached = await RedisCache.get(cacheKey);
	if (cached) return cached;

	const blog = await prisma.blog.findFirst({
		where: {
			id: blogId,
			apiKey: apiKey,
		},
		include: {
			categories: true,
		},
	});

	if (!blog) {
		throw new UnauthorizedError(
			'Invalid API key for this blog',
			'INVALID_API_KEY'
		);
	}

	await RedisCache.set(cacheKey, blog.categories);

	return blog.categories;
};
