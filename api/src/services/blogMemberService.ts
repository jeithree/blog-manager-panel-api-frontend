import prisma from '../prisma.ts';
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
} from '../lib/appError.ts';

export const listMembers = async (requestingUserId: string, blogId: string) => {
	const blog = await prisma.blog.findUnique({where: {id: blogId}});
	if (!blog) throw new NotFoundError('Blog not found');

	// Allow if requester is the blog owner or an editor member
	if (blog.userId === requestingUserId) {
		// owner allowed
	} else {
		const member = await prisma.blogMember.findUnique({
			where: {blogId_userId: {blogId, userId: requestingUserId}},
		});
		if (!member || member.role !== 'EDITOR') {
			throw new ForbiddenError(
				'Only the blog owner or editors can view members'
			);
		}
	}

	const members = await prisma.blogMember.findMany({
		where: {blogId},
		include: {
			user: {select: {id: true, username: true, email: true, name: true}},
		},
	});

	return members;
};

export const addMember = async (
	requestingUserId: string,
	blogId: string,
	userId: string,
	role: 'EDITOR'
) => {
	// verify requestingUserId is owner of the blog
	const blog = await prisma.blog.findUnique({where: {id: blogId}});
	if (!blog) throw new NotFoundError('Blog not found');
	if (blog.userId !== requestingUserId) {
		throw new ForbiddenError('Only the blog owner can assign members');
	}

	// Prevent assigning the blog owner as an editor or changing their role
	if (userId === blog.userId) {
		throw new ForbiddenError('Cannot assign owner as an editor');
	}

	if (role !== 'EDITOR') {
		throw new BadRequestError('Invalid role');
	}

	const existing = await prisma.blogMember.findUnique({
		where: {blogId_userId: {blogId, userId}},
	});
	if (existing) {
		// Prevent changing the owner's membership via this endpoint
		if (existing.role === 'OWNER') {
			throw new ForbiddenError('Cannot change owner role via this endpoint');
		}

		// update role if different
		if (existing.role === role) return existing;
		const updated = await prisma.blogMember.update({
			where: {id: existing.id},
			data: {role},
		});
		return updated;
	}

	const member = await prisma.blogMember.create({data: {blogId, userId, role}});
	return member;
};

export const removeMember = async (
	requestingUserId: string,
	blogId: string,
	userId: string
) => {
	const blog = await prisma.blog.findUnique({where: {id: blogId}});
	if (!blog) throw new NotFoundError('Blog not found');
	if (blog.userId !== requestingUserId) {
		throw new ForbiddenError('Only the blog owner can remove members');
	}

	const existing = await prisma.blogMember.findUnique({
		where: {blogId_userId: {blogId, userId}},
	});
	if (!existing) throw new NotFoundError('Member not found');

	// Prevent removing owner via this endpoint
	if (existing.role === 'OWNER') {
		throw new ForbiddenError('Cannot remove owner via this endpoint');
	}

	await prisma.blogMember.delete({where: {id: existing.id}});
	return {success: true};
};
