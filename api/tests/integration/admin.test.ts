import {describe, it, expect, afterAll, beforeAll, afterEach} from 'vitest';
import request from 'supertest';
import app from '../../src/app.ts';
import {
	createTestUser,
	loginAndGetSession,
	logout,
	deleteTestUser,
} from './testHelpers.ts';
import {NOT_ALLOWED_USERNAMES} from '../../src/services/adminService.ts';
import {SESSION_COOKIE} from '../../src/configs/cookies.ts';

describe('Admin Integration Tests', () => {
	const sessionCookieName = SESSION_COOKIE.name;

	const adminUser = {
		username: 'adminuser',
		email: 'admin@test.com',
		password: 'AdminPass123!',
		role: 'ADMIN' as const,
	};

	const testUser = {
		username: 'testuser',
		email: 'user@test.com',
		password: 'Password123!',
	};

	const testUser2 = {
		username: 'testuser2',
		email: 'user2@test.com',
		password: 'Password123!',
	};

	beforeAll(async () => {
		try {
			await createTestUser(adminUser);
		} catch (error) {
			console.log(error);
		}
	});

	afterAll(async () => {
		try {
			const deleted = await deleteTestUser(adminUser.email);
			if (deleted === 0) {
				console.error('Admin user was not found for deletion.');
			}
		} catch (error) {
			console.error(error);
		}
	});

	afterEach(async () => {
		try {
			await deleteTestUser(testUser.email);
			await deleteTestUser(testUser2.email);
		} catch (error) {
			// Users might not exist, that's ok
		}
	});

	it('should allow admin to create a new user', async () => {
		const adminSessionId = await loginAndGetSession(
			adminUser.email,
			adminUser.password,
		);
		const res = await request(app)
			.post('/api/v1/admin/create-user')
			.set('Cookie', [`${sessionCookieName}=${adminSessionId}`])
			.send(testUser);

		expect(res.statusCode).toEqual(201);
		expect(res.body).toHaveProperty('success', true);
		expect(res.body.data).toStrictEqual({
			id: expect.any(String),
			username: testUser.username,
			email: testUser.email,
			name: null,
			role: 'USER',
			createdAt: expect.any(String),
		});

		await logout(adminSessionId);
	});

	it('should prevent non-admin from creating a new user', async () => {
		await createTestUser({...testUser, role: 'USER'});

		const userSessionId = await loginAndGetSession(
			testUser.email,
			testUser.password,
		);

		const res = await request(app)
			.post('/api/v1/admin/create-user')
			.set('Cookie', [`${sessionCookieName}=${userSessionId}`])
			.send(testUser2);

		expect(res.statusCode).toEqual(401);
		expect(res.body).toHaveProperty('success', false);
		expect(res.body).toHaveProperty('error');
		expect(res.body.error).toHaveProperty(
			'message',
			'You do not have admin privileges',
		);

		await logout(userSessionId);
	});

	it('shouldnt allow creating users with not allowed usernames', async () => {
		const adminSessionId = await loginAndGetSession(
			adminUser.email,
			adminUser.password,
		);
		for (const username of NOT_ALLOWED_USERNAMES) {
			const res = await request(app)
				.post('/api/v1/admin/create-user')
				.set('Cookie', [`${sessionCookieName}=${adminSessionId}`])
				.send({
					username,
					email: `${username}@test.com`,
					password: testUser.password,
				});

			expect(res.statusCode).toEqual(409);
			expect(res.body).toHaveProperty('success', false);
			expect(res.body).toHaveProperty('error');
			expect(res.body.error).toHaveProperty(
				'message',
				`The chosen username "${username}" is not allowed`,
			);
		}

		await logout(adminSessionId);
	});

	it('shouldnt allow creating users with duplicate usernames or emails', async () => {
		const adminSessionId = await loginAndGetSession(
			adminUser.email,
			adminUser.password,
		);

		// First, create a user successfully
		const res1 = await request(app)
			.post('/api/v1/admin/create-user')
			.set('Cookie', [`${sessionCookieName}=${adminSessionId}`])
			.send(testUser);

		expect(res1.statusCode).toEqual(201);

		// Try to create another user with the same username but different email
		const res2 = await request(app)
			.post('/api/v1/admin/create-user')
			.set('Cookie', [`${sessionCookieName}=${adminSessionId}`])
			.send({
				username: testUser.username,
				email: 'different@test.com',
				password: testUser.password,
			});

		expect(res2.statusCode).toEqual(409);
		expect(res2.body).toHaveProperty('success', false);
		expect(res2.body).toHaveProperty('error');
		expect(res2.body.error).toHaveProperty('message', 'Username already taken');

		// Try to create another user with the same email but different username
		const res3 = await request(app)
			.post('/api/v1/admin/create-user')
			.set('Cookie', [`${sessionCookieName}=${adminSessionId}`])
			.send({
				username: 'differentUsername',
				email: testUser.email,
				password: testUser.password,
			});

		expect(res3.statusCode).toEqual(409);
		expect(res3.body).toHaveProperty('success', false);
		expect(res3.body).toHaveProperty('error');
		expect(res3.body.error).toHaveProperty(
			'message',
			'Email already registered',
		);

		await logout(adminSessionId);
	});

	it('should convert username and email to lowercase when creating a user', async () => {
		const adminSessionId = await loginAndGetSession(
			adminUser.email,
			adminUser.password,
		);

		const res = await request(app)
			.post('/api/v1/admin/create-user')
			.set('Cookie', [`${sessionCookieName}=${adminSessionId}`])
			.send({
				username: 'TestUserUpper',
				email: 'user@Test.com',
				password: testUser.password,
			});
		expect(res.statusCode).toEqual(201);
		expect(res.body).toHaveProperty('success', true);
		expect(res.body.data).toHaveProperty('username', 'testuserupper');
		expect(res.body.data).toHaveProperty('email', 'user@test.com');

		await logout(adminSessionId);
	});
});
