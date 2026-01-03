import type {Request, Response, NextFunction} from 'express';
import * as blogMemberService from '../services/blogMemberService.ts';
import {successResponse} from '../lib/apiResponse.ts';
import type {AddBlogMemberDto} from '../types/blogMember.ts';

export const listMembers = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const requestingUserId = req.session.userId as string;
		const blogId = req.params.blogId as string;
		const members = await blogMemberService.listMembers(
			requestingUserId,
			blogId
		);
		return res.status(200).json(successResponse('Members fetched', members));
	} catch (err) {
		return next(err);
	}
};

export const addMember = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const requestingUserId = req.session.userId as string;
		const blogId = req.params.blogId as string;
		const body = req.body as AddBlogMemberDto;
		const member = await blogMemberService.addMember(
			requestingUserId,
			blogId,
			body.userId,
			(body.role as 'EDITOR') || 'EDITOR'
		);
		return res.status(201).json(successResponse('Member added', member));
	} catch (err) {
		return next(err);
	}
};

export const removeMember = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const requestingUserId = req.session.userId as string;
		const blogId = req.params.blogId as string;
		const userId = req.params.userId as string;
		const result = await blogMemberService.removeMember(
			requestingUserId,
			blogId,
			userId
		);
		return res.status(200).json(successResponse('Member removed', result));
	} catch (err) {
		return next(err);
	}
};
