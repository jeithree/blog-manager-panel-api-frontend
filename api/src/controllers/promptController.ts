import type {Request, Response, NextFunction} from 'express';
import type {
	CreatePromptDto,
	GetPromptsQueryDto,
	UpdatePromptDto,
} from '../types/prompt.ts';
import * as promptService from '../services/promptService.ts';
import {successResponse} from '../lib/apiResponse.ts';

export const createPrompt = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const promptData = req.body as CreatePromptDto;
		const prompt = await promptService.createPrompt(userId, promptData);

		return res
			.status(201)
			.json(successResponse('Prompt created successfully', prompt));
	} catch (error) {
		return next(error);
	}
};

export const getPrompts = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const query = req.query as unknown as GetPromptsQueryDto;
		const blogId = query.blogId as string;
		const prompts = await promptService.getPrompts(userId, blogId);

		return res
			.status(200)
			.json(successResponse('Prompts fetched successfully', prompts));
	} catch (error) {
		return next(error);
	}
};

export const updatePrompt = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const promptId = req.params.id as string;
		const promptData = req.body as UpdatePromptDto;
		const updated = await promptService.updatePrompt(
			userId,
			promptId,
			promptData
		);

		return res
			.status(200)
			.json(successResponse('Prompt updated successfully', updated));
	} catch (error) {
		return next(error);
	}
};
