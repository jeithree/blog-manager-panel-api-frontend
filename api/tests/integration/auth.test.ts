import {describe, it, expect, afterAll, beforeAll} from 'vitest';
import request from 'supertest';
import app from '../../src/app.ts';
import prisma from '../../src/prisma.ts';
import { registerTestUser } from './testHelpers.ts';

describe('Authentication Integration Tests', () => {
	const testUser = {
		username: 'testuser',
		email: 'user@test.com',
		password: 'Password123!',
        role: 'USER' as const,
	};

	beforeAll(async () => {
		try {
			await registerTestUser(testUser);
		} catch (error) {
			console.log(error);
		}
	});

	let sessionId = '';

	afterAll(async () => {
		try {
			await prisma.user.delete({where: {email: testUser.email}});
		} catch (error) {
			console.log(error);
		}
	});

	it('should fail login when incorrect password is passed', async () => {
		const res = await request(app).post('/api/v1/auth/login').send({
			email: testUser.email,
			password: 'WrongPassword!',
		});

		expect(res.statusCode).toEqual(400);
		expect(res.body).toStrictEqual({
			success: false,
			error: {message: 'Invalid email or password', code: 'BAD_REQUEST'},
		});
	});

	it('should login successfully with correct credentials', async () => {
		const res = await request(app).post('/api/v1/auth/login').send({
			email: testUser.email,
			password: testUser.password,
		});

		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('message', 'Login successful');
		expect(res.body.data).toStrictEqual({
			id: expect.any(String),
			username: testUser.username,
			email: testUser.email,
			name: null,
			role: 'USER',
		});
		expect(res.headers['set-cookie']).toBeDefined();
		sessionId = res.headers['set-cookie'][0].split(';')[0].split('=')[1];
	});

	it('should get session info successfully if there is an active session', async () => {
		const res = await request(app)
			.get('/api/v1/auth/session')
			.set('Cookie', [`sid=${sessionId}`]);

		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('message', 'Session retrieved');
		expect(res.body.data).toStrictEqual({
			isAuthenticated: true,
			user: {
				id: expect.any(String),
				username: testUser.username,
				email: testUser.email,
				role: 'USER',
			},
		});
	});

	it('should logout successfully if there is an active session', async () => {
		const res = await request(app)
			.post('/api/v1/auth/logout')
			.set('Cookie', [`sid=${sessionId}`]);

		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('message', 'Logout successful');
	});

	it('should have no active session after logout', async () => {
		const res = await request(app)
			.get('/api/v1/auth/session')
			.set('Cookie', [`sid=${sessionId}`]);

		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('message', 'Session retrieved');
		expect(res.body.data).toStrictEqual({
			isAuthenticated: false,
			user: null,
		});
	});
});
