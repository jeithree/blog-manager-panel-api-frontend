import type {Request, Response, NextFunction} from 'express';
import prisma from '../prisma.ts';
import {
	ForbiddenError,
	NotFoundError,
	BadRequestError,
} from '../lib/appError.ts';

type Role = 'OWNER' | 'EDITOR';

// allowedRoles: roles that permit access (e.g., ['OWNER','EDITOR'])
export const requireBlogRoles = (allowedRoles: Role[]) => {
	return async (req: Request, _res: Response, next: NextFunction) => {
		const userId = req.session.userId as string | undefined;
		if (!userId) return next(new ForbiddenError('Authentication required'));

		// Determine blogId: try params, body, query, or resolve via postId
		let blogId = (req.params as any).blogId as string | undefined;
		if (!blogId)
			blogId = (req.body && (req.body.blogId as string)) || undefined;
		if (!blogId)
			blogId = (req.query && (req.query.blogId as string)) || undefined;

		// If still no blogId, but we have postId, fetch the post to get blogId
		if (!blogId && req.params.postId) {
			const post = await prisma.post.findUnique({
				where: {id: req.params.postId},
				select: {blogId: true},
			});
			if (!post) return next(new NotFoundError('Post not found'));
			blogId = post.blogId;
		}

		if (!blogId)
			return next(
				new BadRequestError(
					'Blog ID is required for this action',
					'BLOG_ID_REQUIRED'
				)
			);

		// Fetch blog to check owner
		const blog = await prisma.blog.findUnique({where: {id: blogId}});
		if (!blog) return next(new NotFoundError('Blog not found'));

		// Owner has full rights
		if (blog.userId === userId) return next();

		// Check membership role
		const member = await prisma.blogMember.findUnique({
			where: {blogId_userId: {blogId, userId}},
		});
		if (!member)
			return next(new ForbiddenError('You are not a member of this blog'));

		if (allowedRoles.includes(member.role as Role)) return next();

		return next(new ForbiddenError('Insufficient permissions for this action'));
	};
};
