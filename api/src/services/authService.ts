import type {RegisterDto, LoginDto} from '../types/auth.ts';
import prisma from '../prisma.ts';
import {hashPassword, comparePassword} from '../helpers/password.ts';
import {ConflictError, BadRequestError} from '../lib/appError.ts';

export const NOT_ALLOWED_USERNAMES = [
	// Spanish
	'admin',
	'administrador',
	'superusuario',
	'root',
	'administra',
	'supervisor',
	'gestor',
	'administrativo',
	'administración',
	'sysadmin',
	// English
	'admin',
	'administrator',
	'superuser',
	'root',
	'manage',
	'supervisor',
	'systemadmin',
	'manager',
	'executive',
	'control',
];

export const register = async (data: RegisterDto) => {
	// Check for not allowed usernames
	if (NOT_ALLOWED_USERNAMES.includes(data.username.toLowerCase())) {
		throw new ConflictError(`The chosen username "${data.username}" is not allowed`);
	}

	// Check if username exists
	const existingUsername = await prisma.user.findUnique({
		where: {username: data.username.toLowerCase()},
	});

	if (existingUsername) {
		throw new ConflictError('Username already taken', 'USERNAME_TAKEN');
	}

	// Check if email exists
	const existingEmail = await prisma.user.findUnique({
		where: {email: data.email.toLowerCase()},
	});

	if (existingEmail) {
		throw new ConflictError('Email already registered', 'EMAIL_TAKEN');
	}

	// Hash password
	const hashedPassword = await hashPassword(data.password);

	// Create user
	const user = await prisma.user.create({
		data: {
			username: data.username.toLowerCase(),
			email: data.email.toLowerCase(),
			password: hashedPassword,
			name: data.name,
		},
		select: {
			id: true,
			username: true,
			email: true,
			name: true,
			role: true,
			createdAt: true,
		},
	});

	return user;
};

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
