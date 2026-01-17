import request from 'supertest';
import app from '../../src/app.ts';
import prisma from '../../src/prisma.ts';
import {hashPassword} from '../../src/helpers/password.ts';

export const registerTestUser = async (userToCreate: {
	username: string;
	email: string;
	password: string;
	role: 'USER' | 'ADMIN';
}) => {
	const hashedPassword = await hashPassword(userToCreate.password,);

	await prisma.user.create({
		data: {
			username: userToCreate.username,
			email: userToCreate.email,
			password: hashedPassword,
			role: userToCreate.role,
		},
	});
};

export const deleteTestUser = async (email: string) => {
    await prisma.user.delete({where: {email}});
};

export const loginAndGetSession = async (email: string, password: string) => {
	const res = await request(app)
		.post('/api/v1/auth/login')
		.send({email, password});
	const sessionId = res.headers['set-cookie'][0].split(';')[0].split('=')[1];
	return sessionId;
};

export const logout = async (sessionId: string) => {
	await request(app)
		.post('/api/v1/auth/logout')
		.set('Cookie', `connect.sid=${sessionId}`);
};
