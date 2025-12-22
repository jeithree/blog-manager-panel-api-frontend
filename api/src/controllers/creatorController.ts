import type {Request, Response, NextFunction} from 'express';
import type {
	GeneratePostContentDto,
	GenerateImagePromptDto,
	GeneratePostEditDto,
} from '../types/creator.ts';
import * as creatorService from '../services/creatorService.ts';
import {successResponse} from '../lib/apiResponse.ts';

export const generateTitleSuggestions = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const blogId = req.body.blogId as string;
		const titleSuggestions = await creatorService.generateTitleSuggestions(
			userId,
			blogId
		);

		return res
			.status(200)
			.json(
				successResponse(
					'Title suggestions generated successfully',
					titleSuggestions
				)
			);
	} catch (error) {
		return next(error);
	}
};

export const generatePostContent = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const {blogId, categoryId, title} = req.body as GeneratePostContentDto;
		const postContent = await creatorService.generatePostContent(userId, {
			blogId,
			categoryId,
			title,
		});

		return res
			.status(200)
			.json(
				successResponse('Post content generated successfully', postContent)
			);
	} catch (error) {
		return next(error);
	}
};

export const generateImagePrompt = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const {blogPost} = req.body as GenerateImagePromptDto;
		const imagePrompt = await creatorService.generateImagePrompt(blogPost);

		return res
			.status(200)
			.json(
				successResponse('Image prompt generated successfully', {imagePrompt})
			);
	} catch (error) {
		return next(error);
	}
};

export const generatePostEdit = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const {blogId, postId, changeRequest} = req.body as GeneratePostEditDto;
		const postEdited = await creatorService.generatePostEdit(userId, {
			blogId,
			postId,
			changeRequest,
		});

		return res
			.status(200)
			.json(successResponse('Post edit generated successfully', postEdited));
	} catch (error) {
		return next(error);
	}
};
