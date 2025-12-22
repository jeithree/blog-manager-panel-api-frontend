import prisma from '../prisma.ts';
import type {CreateAuthorDto} from '../types/author.ts';
import {NotFoundError} from '../lib/appError.ts';

export const createAuthor = async (
	userId: string,
	authorData: CreateAuthorDto
) => {
	const blog = await prisma.blog.findFirst({
		where: {
			id: authorData.blogId,
			userId: userId,
		},
	});

	if (!blog) {
		throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
	}

	const newAuthor = await prisma.author.create({
		data: {
			...authorData,
		},
	});

	return newAuthor;
};

export const getAuthors = async (userId: string, blogId: string) => {
	return prisma.author.findMany({
		where: {
			blog: {
				userId,
				id: blogId
			},
		},
		orderBy: {createdAt: 'desc'},
	});
};
