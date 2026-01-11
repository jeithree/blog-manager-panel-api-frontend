import type {CreateUserDto} from '../types/admin.ts';
import prisma from '../prisma.ts';
import {hashPassword} from '../helpers/password.ts';
import {ConflictError} from '../lib/appError.ts';
import {
	ADMIN_USERNAME,
	ADMIN_EMAIL,
	ADMIN_PASSWORD,
} from '../configs/basics.ts';
import * as Logger from '../helpers/logger.ts';

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

export const createInitialAdminUser = async () => {
	const existingAdmin = await prisma.user.findFirst({
		where: {role: 'ADMIN'},
	});
	if (existingAdmin) {
		return;
	}

	const hashedPassword = await hashPassword(ADMIN_PASSWORD);
	try {
		await prisma.user.create({
			data: {
				username: ADMIN_USERNAME.toLowerCase(),
				email: ADMIN_EMAIL.toLowerCase(),
				password: hashedPassword,
				role: 'ADMIN',
			},
		});
	} catch (error) {
		Logger.log(error, 'error');
		throw error;
	}
};

export const createUser = async (data: CreateUserDto) => {
	// Check for not allowed usernames
	if (NOT_ALLOWED_USERNAMES.includes(data.username.toLowerCase())) {
		throw new ConflictError(
			`The chosen username "${data.username}" is not allowed`
		);
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
