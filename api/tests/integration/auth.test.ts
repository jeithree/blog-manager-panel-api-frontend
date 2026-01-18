import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import request from 'supertest';
import app from '../../src/app.ts';
import {
	clearRedisSessions,
	clearUserTable,
	createTestUser,
	loginAndGetSession,
} from './testHelpers.ts';
import {SESSION_COOKIE} from '../../src/configs/cookies.ts';

describe('Authentication Integration Tests', () => {
	const sessionCookieName = SESSION_COOKIE.name;
	let agent: ReturnType<typeof request.agent>;

	beforeEach(async () => {
		agent = request.agent(app);
	});

	afterEach(async () => {
		try {
			await clearUserTable();
			await clearRedisSessions();
		} catch (error) {
			console.error('Error during afterEach cleanup:', error);
		}
	});

	it('should fail login when incorrect password is passed', async () => {
		const user = await createTestUser();

		const res = await agent.post('/api/v1/auth/login').send({
			email: user.email,
			password: 'WrongPassword!',
		});

		expect(res.statusCode).toEqual(400);
		expect(res.body).toStrictEqual({
			success: false,
			error: {message: 'Invalid email or password', code: 'BAD_REQUEST'},
		});
	});

	it('should login successfully with correct credentials', async () => {
		const user = await createTestUser();

		const res = await agent.post('/api/v1/auth/login').send({
			email: user.email,
			password: user.password,
		});

		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('message', 'Login successful');
		expect(res.body.data).toStrictEqual({
			id: expect.any(String),
			username: user.username,
			email: user.email,
			name: null,
			role: 'USER',
		});
		expect(res.headers['set-cookie']).toBeDefined();
	});

	it('should get session info successfully if there is an active session', async () => {
		const user = await createTestUser();
		const userSessionId = await loginAndGetSession(user.email, user.password);

		const res = await agent
			.get('/api/v1/auth/session')
			.set('Cookie', [`${sessionCookieName}=${userSessionId}`]);

		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('message', 'Session retrieved');
		expect(res.body.data).toStrictEqual({
			isAuthenticated: true,
			user: {
				id: expect.any(String),
				username: user.username,
				email: user.email,
				role: 'USER',
			},
		});
	});

	it('should logout successfully if there is an active session', async () => {
		const user = await createTestUser();
		const userSessionId = await loginAndGetSession(user.email, user.password);

		const res = await agent
			.post('/api/v1/auth/logout')
			.set('Cookie', [`${sessionCookieName}=${userSessionId}`]);

		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('message', 'Logout successful');
	});

	it('should have no active session after logout', async () => {
		const user = await createTestUser();
		const userSessionId = await loginAndGetSession(user.email, user.password);

		await agent
			.post('/api/v1/auth/logout')
			.set('Cookie', [`${sessionCookieName}=${userSessionId}`]);

		const res = await agent
			.get('/api/v1/auth/session')
			.set('Cookie', [`${sessionCookieName}=${userSessionId}`]);

		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('message', 'Session retrieved');
		expect(res.body.data).toStrictEqual({
			isAuthenticated: false,
			user: null,
		});
	});
});
