import type {Request, Response, NextFunction} from 'express';
import type {
	GeneratePostContentDto,
	GenerateImagePromptDto,
	GeneratePostEditDto,
	ReviewPostDto,
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
		const {blogId, categoryId, slug, title} =
			req.body as GeneratePostContentDto;
		const postContent = await creatorService.generatePostContent(userId, {
			blogId,
			categoryId,
			title,
			slug,
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
		const {blogPost, blogId} = req.body as GenerateImagePromptDto;
		const imagePrompt = await creatorService.generateImagePrompt(
			blogPost,
			blogId
		);

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

export const reviewPost = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const {blogId, postTitle, postDescription, postContent} =
			req.body as ReviewPostDto;
		const issues = await creatorService.reviewGeneratedPost(userId, {
			blogId,
			postTitle,
			postDescription: postDescription || '',
			postContent,
		});

		return res
			.status(200)
			.json(
				successResponse('Post reviewed successfully', {
					AIPostReviewIssues: issues,
				})
			);
	} catch (error) {
		return next(error);
	}
};
