import type {Request, Response, NextFunction} from 'express';
import type {
	CreateCategoryDto,
	GetCategoriesQueryDto,
} from '../types/category.ts';
import * as categoryService from '../services/categoryService.ts';
import {successResponse} from '../lib/apiResponse.ts';

export const createCategory = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const categoryData = req.body as CreateCategoryDto;
		const category = await categoryService.createCategory(userId, categoryData);

		return res
			.status(201)
			.json(successResponse('Category created successfully', category));
	} catch (error) {
		return next(error);
	}
};

export const getCategories = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const query = req.query as unknown as GetCategoriesQueryDto;
		const blogId = query.blogId as string;
		const categories = await categoryService.getCategories(userId, blogId);

		return res
			.status(200)
			.json(successResponse('Categories fetched successfully', categories));
	} catch (error) {
		return next(error);
	}
};

// Public Controllers

export const getPublicCategories = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const apiKey = req.header('x-api-key') as string;
		const query = req.query as unknown as GetCategoriesQueryDto;
		const blogId = query.blogId as string;

		const categories = await categoryService.getPublicCategories(
			apiKey,
			blogId
		);

		return res
			.status(200)
			.json(successResponse('Categories fetched successfully', categories));
	} catch (error) {
		return next(error);
	}
};
