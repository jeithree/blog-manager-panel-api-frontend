import type {LoginDto} from '../types/auth.ts';
import prisma from '../prisma.ts';
import {comparePassword} from '../helpers/password.ts';
import {BadRequestError} from '../lib/appError.ts';

export const login = async (data: LoginDto) => {
	// Find user by email
	const user = await prisma.user.findUnique({
		where: {email: data.email.toLowerCase()},
	});

	if (!user) {
		throw new BadRequestError('Invalid email or password');
	}

	// Compare password
	const isPasswordValid = await comparePassword(data.password, user.password);

	if (!isPasswordValid) {
		throw new BadRequestError('Invalid email or password');
	}

	return {
		id: user.id,
		username: user.username,
		email: user.email,
		name: user.name,
		role: user.role,
	};
};

export const getUserById = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: {id: userId},
		select: {
			id: true,
			username: true,
			email: true,
			name: true,
			avatar: true,
			role: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	return user;
};

export const updateUser = async (
	userId: string,
	data: {name?: string; avatar?: string}
) => {
	const user = await prisma.user.update({
		where: {id: userId},
		data: data,
		select: {
			id: true,
			username: true,
			email: true,
			name: true,
			avatar: true,
			role: true,
			updatedAt: true,
		},
	});

	return user;
};
