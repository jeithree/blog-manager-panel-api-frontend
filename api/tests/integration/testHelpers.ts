import request from 'supertest';
import app from '../../src/app.ts';
import prisma from '../../src/prisma.ts';
import {hashPassword} from '../../src/helpers/password.ts';
import {SESSION_REDIS_PREFIX} from '../../src/configs/basics.ts';
import redisClient from '../../src/redisClient.ts';

export const generateRandomTestUser = () => {
	const randomId = Math.random().toString(36).substring(2, 10);
	return {
		username: `testuser_${randomId}`,
		email: `user_${randomId}@test.com`,
		password: 'Password123!',
	};
};

export const createTestUser = async (
	override: {
		username?: string;
		email?: string;
		password?: string;
		role?: 'USER' | 'ADMIN';
	} = {},
) => {
	const plainPassword = override.password || 'Password123!';
	const hashedPassword = await hashPassword(plainPassword);
	const randomId = Math.random().toString(36).substring(2, 10);

	const user = await prisma.user.create({
		data: {
			username: override.username || `testuser_${randomId}`,
			email: override.email || `user_${randomId}@test.com`,
			password: hashedPassword,
			role: override.role || 'USER',
		},
	});

	// Return user with plain password for testing
	return {
		...user,
		password: plainPassword,
	};
};

export const clearUserTable = async () => {
	await prisma.user.deleteMany({});
};

export const loginAndGetSession = async (email: string, password: string) => {
	const res = await request(app)
		.post('/api/v1/auth/login')
		.send({email, password});

	const sessionId = res.headers['set-cookie'][0].split(';')[0].split('=')[1];
	return sessionId;
};

export const clearRedisSessions = async () => {
	const keys = await redisClient.keys(`${SESSION_REDIS_PREFIX}*`);
	if (keys.length > 0) {
		await redisClient.del(keys);
	}
};
