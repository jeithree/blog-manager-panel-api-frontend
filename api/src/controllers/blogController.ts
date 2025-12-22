import type {Request, Response, NextFunction} from 'express';
import type {CreateBlogDto, UpdateBlogDto} from '../types/blog.ts';
import * as blogService from '../services/blogService.ts';
import {successResponse} from '../lib/apiResponse.ts';

export const getBlogs = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const blogs = await blogService.getBlogs(userId);

		return res
			.status(200)
			.json(successResponse('Blogs fetched successfully', blogs));
	} catch (error) {
		return next(error);
	}
};

export const getBlog = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const blogId = req.params.blogId as string | undefined;
		const blog = await blogService.getBlog(userId, blogId);

		return res
			.status(200)
			.json(successResponse('Blog fetched successfully', blog));
	} catch (error) {
		return next(error);
	}
};

export const createBlog = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const blogData = req.body as CreateBlogDto;
		const blog = await blogService.createBlog(userId, blogData);

		return res
			.status(201)
			.json(successResponse('Blog created successfully', blog));
	} catch (error) {
		return next(error);
	}
};

export const updateBlog = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const blogId = req.params.blogId as string | undefined;
		const blogData = req.body as UpdateBlogDto;
		const blog = await blogService.updateBlog(userId, blogId, blogData);

		return res
			.status(200)
			.json(successResponse('Blog updated successfully', blog));
	} catch (error) {
		return next(error);
	}
};

// Public Controllers

export const getPublicBlog = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const apiKey = req.header('x-api-key') as string;
		const blogId = req.params.blogId as string | undefined;
		const blog = await blogService.getPublicBlog(apiKey, blogId);

		return res
			.status(200)
			.json(successResponse('Blog fetched successfully', blog));
	} catch (error) {
		return next(error);
	}
};
