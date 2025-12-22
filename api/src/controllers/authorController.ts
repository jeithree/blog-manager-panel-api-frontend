import type {Request, Response, NextFunction} from 'express';
import type {CreateAuthorDto, GetAuthorsDto} from '../types/author.ts';
import * as authorService from '../services/authorService.ts';
import {successResponse} from '../lib/apiResponse.ts';

export const getAuthors = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const query = req.query as GetAuthorsDto;
		const blogId = query.blogId;
		const authors = await authorService.getAuthors(userId, blogId);

		return res.json(successResponse('Authors fetched successfully', authors));
	} catch (error) {
		return next(error);
	}
};

export const createAuthor = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const authorData = req.body as CreateAuthorDto;
		const author = await authorService.createAuthor(userId, authorData);

		return res
			.status(201)
			.json(successResponse('Author created successfully', author));
	} catch (error) {
		return next(error);
	}
};
