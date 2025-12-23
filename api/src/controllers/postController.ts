import type {Request, Response, NextFunction} from 'express';
import type {
	CreatePostDto,
	GetPostByIdQueryDto,
	GetPostsQueryDto,
	UpdatePostDto,
} from '../types/post.ts';
import * as postService from '../services/postService.ts';
import {successResponse} from '../lib/apiResponse.ts';

export const createPost = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const postData = req.body as CreatePostDto;
		const file = req.file as Express.Multer.File | undefined;
		const post = await postService.createPost(userId, postData, file);

		return res
			.status(201)
			.json(successResponse('Post created successfully', post));
	} catch (error) {
		return next(error);
	}
};

export const getPosts = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const query = req.query as unknown as GetPostsQueryDto;
		const {blogId, categoryId, tagId, status, page, pageSize} = query;

		const result = await postService.getPosts(userId, {
			blogId,
			categoryId,
			tagId,
			status,
			page,
			pageSize,
		});

		return res.status(200).json(
			successResponse('Posts fetched successfully', {
				posts: result.items,
				total: result.total,
				page: result.page,
				pageSize: result.pageSize,
				totalPages: result.totalPages,
			})
		);
	} catch (error) {
		return next(error);
	}
};

export const getPostById = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const query = req.query as unknown as GetPostByIdQueryDto;
		const blogId = query.blogId as string;
		const postId = req.params.postId as string;

		const post = await postService.getPostById(userId, blogId, postId);

		return res
			.status(200)
			.json(successResponse('Post fetched successfully', post));
	} catch (error) {
		return next(error);
	}
};

export const updatePost = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const postId = req.params.postId as string;
		const postData = req.body as UpdatePostDto;
		const file = req.file as Express.Multer.File | undefined;
		const post = await postService.updatePost(userId, postId, postData, file);

		return res
			.status(200)
			.json(successResponse('Post updated successfully', post));
	} catch (error) {
		return next(error);
	}
};

export const deletePost = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const postId = req.params.postId as string;
		await postService.deletePost(userId, postId);

		return res.status(200).json(successResponse('Post deleted successfully'));
	} catch (error) {
		return next(error);
	}
};

export const exportPostMarkdown = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = req.session.userId as string;
		const postId = req.params.postId as string;
		const query = req.query as unknown as GetPostByIdQueryDto;
		const blogId = query.blogId as string;

		await postService.getPostById(userId, blogId, postId);
		await postService.toMarkdownContent(postId);

		return res.status(200).json(successResponse('Markdown export triggered'));
	} catch (error) {
		return next(error);
	}
};

// Public Controllers

export const getPublicPosts = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const apiKey = req.header('x-api-key') as string;
		const query = req.query as unknown as GetPostsQueryDto;
		const {blogId, categoryId, tagId, page, pageSize} = query;

		const result = await postService.getPublicPosts(apiKey, {
			blogId,
			categoryId,
			tagId,
			page,
			pageSize,
		});

		return res.status(200).json(
			successResponse('Posts fetched successfully', {
				posts: result.items,
				total: result.total,
				page: result.page,
				pageSize: result.pageSize,
				totalPages: result.totalPages,
			})
		);
	} catch (error) {
		return next(error);
	}
};

export const getPublicPostBySlug = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const apiKey = req.header('x-api-key') as string;
		const query = req.query as unknown as GetPostByIdQueryDto;
		const blogId = query.blogId as string;
		const slug = req.params.slug as string | undefined;

		const post = await postService.getPublicPostBySlug(apiKey, blogId, slug);

		return res
			.status(200)
			.json(successResponse('Post fetched successfully', post));
	} catch (error) {
		return next(error);
	}
};
