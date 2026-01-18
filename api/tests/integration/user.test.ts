import {describe, it, expect, afterAll, beforeAll} from 'vitest';
import request from 'supertest';
import app from '../../src/app.ts';
import {
	createTestUser,
	loginAndGetSession,
	logout,
	deleteTestUser,
} from './testHelpers.ts';
import {SESSION_COOKIE} from '../../src/configs/cookies.ts';

describe('User Integration Tests', () => {
	const sessionCookieName = SESSION_COOKIE.name;

	const testUser = {
		username: 'testuser',
		email: 'user@test.com',
		password: 'Password123!',
		role: 'USER' as const,
	};

	let sessionId = '';

	beforeAll(async () => {
		try {
			await createTestUser(testUser);
		} catch (error) {
			console.log(error);
		}
	});

	afterAll(async () => {
		try {
			await logout(sessionId);
			const deleted = await deleteTestUser(testUser.email);
			if (deleted === 0) {
				console.error('Admin user was not found for deletion.');
			}
		} catch (error) {
			console.log(error);
		}
	});

	it('should get user Data by ID', async () => {
		sessionId = await loginAndGetSession(testUser.email, testUser.password);
		const res = await request(app)
			.get('/api/v1/users/me')
			.set('Cookie', [`${sessionCookieName}=${sessionId}`]);

		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('success', true);
		expect(res.body.data).toStrictEqual({
			id: expect.any(String),
			username: testUser.username,
			email: testUser.email,
			name: null,
			avatar: null,
			role: 'USER',
			createdAt: expect.any(String),
			updatedAt: expect.any(String),
		});
	});

	it('should update user profile', async () => {
		const res = await request(app)
			.patch('/api/v1/users/me')
			.set('Cookie', [`${sessionCookieName}=${sessionId}`])
			.send({
				name: 'Updated Name',
				avatar: 'https://example.com/avatar.png',
			});

		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('message', 'Profile updated successfully');
		expect(res.body).toHaveProperty('success', true);
		expect(res.body.data).toStrictEqual({
			id: expect.any(String),
			username: testUser.username,
			email: testUser.email,
			name: 'Updated Name',
			avatar: 'https://example.com/avatar.png',
			role: 'USER',
			updatedAt: expect.any(String),
		});
	});
});
