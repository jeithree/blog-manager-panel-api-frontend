import type {Request, Response, NextFunction} from 'express';
import type {CreateTagDto, GetTagsQueryDto} from '../types/tag.ts';
import * as tagService from '../services/tagService.ts';
import {successResponse} from '../lib/apiResponse.ts';

export const createTag = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const tagData = req.body as CreateTagDto;
		const tag = await tagService.createTag(userId, tagData);

		return res
			.status(201)
			.json(successResponse('Tag created successfully', tag));
	} catch (error) {
		return next(error);
	}
};

export const getTags = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const query = req.query as unknown as GetTagsQueryDto;
		const blogId = query.blogId as string;
		const tags = await tagService.getTags(userId, blogId);

		return res
			.status(200)
			.json(successResponse('Tags fetched successfully', tags));
	} catch (error) {
		return next(error);
	}
};

// Public Controllers

export const getPublicTags = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const apiKey = req.header('x-api-key') as string;
		const query = req.query as unknown as GetTagsQueryDto;
		const blogId = query.blogId as string;

		const tags = await tagService.getPublicTags(apiKey, blogId);

		return res
			.status(200)
			.json(successResponse('Tags fetched successfully', tags));
	} catch (error) {
		return next(error);
	}
};
