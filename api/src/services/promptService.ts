import prisma from '../prisma.ts';
import type {CreatePromptDto, UpdatePromptDto} from '../types/prompt.ts';
import {NotFoundError} from '../lib/appError.ts';

export const createPrompt = async (
	userId: string,
	promptData: CreatePromptDto
) => {
	const blog = await prisma.blog.findFirst({
		where: {
			id: promptData.blogId,
			userId: userId,
		},
	});

	if (!blog) {
		throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
	}

	const newPrompt = await prisma.prompt.create({
		data: {
			...promptData,
		},
	});

	return newPrompt;
};

export const getPrompts = async (userId: string, blogId: string) => {
	const blog = await prisma.blog.findFirst({
		where: {
			id: blogId,
			userId,
		},
		include: {prompts: true},
	});

	if (!blog) {
		throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
	}

	return blog.prompts;
};

export const updatePrompt = async (
	userId: string,
	promptId: string,
	promptData: UpdatePromptDto
) => {
	const prompt = await prisma.prompt.findUnique({
		where: {id: promptId},
		select: {id: true, blogId: true},
	});

	if (!prompt) {
		throw new NotFoundError('Prompt not found', 'PROMPT_NOT_FOUND');
	}

	const blog = await prisma.blog.findFirst({
		where: {id: prompt.blogId, userId},
		select: {id: true},
	});

	if (!blog) {
		throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
	}

	const updated = await prisma.prompt.update({
		where: {id: promptId},
		data: {
			...(promptData.name ? {name: promptData.name} : {}),
			...(promptData.content ? {content: promptData.content} : {}),
		},
	});

	return updated;
};
