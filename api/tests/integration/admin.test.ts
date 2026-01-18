import {describe, it, expect, afterEach, beforeEach} from 'vitest';
import request from 'supertest';
import app from '../../src/app.ts';
import {
	clearRedisSessions,
	clearUserTable,
	createTestUser,
	generateRandomTestUser,
	loginWithAgent,
} from './testHelpers.ts';
import {NOT_ALLOWED_USERNAMES} from '../../src/services/adminService.ts';

describe('Admin Integration Tests', () => {
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

	it('should allow admin to create a new user', async () => {
		const admin = await createTestUser({role: 'ADMIN'});
		await loginWithAgent(agent, admin.email, admin.password);

		const user = generateRandomTestUser();
		const res = await agent.post('/api/v1/admin/create-user').send(user);

		expect(res.statusCode).toEqual(201);
		expect(res.body).toHaveProperty('success', true);
		expect(res.body.data).toStrictEqual({
			id: expect.any(String),
			username: user.username,
			email: user.email,
			name: null,
			role: 'USER',
			createdAt: expect.any(String),
		});
	});

	it('should prevent non-admin from creating a new user', async () => {
		const user = await createTestUser();
		await loginWithAgent(agent, user.email, user.password);

		const user2 = generateRandomTestUser();
		const res = await agent.post('/api/v1/admin/create-user').send(user2);

		expect(res.statusCode).toEqual(401);
		expect(res.body).toHaveProperty('success', false);
		expect(res.body).toHaveProperty('error');
		expect(res.body.error).toHaveProperty(
			'message',
			'You do not have admin privileges',
		);
	});

	it('shouldnt allow creating users with not allowed usernames', async () => {
		const admin = await createTestUser({role: 'ADMIN'});
		await loginWithAgent(agent, admin.email, admin.password);

		for (const username of NOT_ALLOWED_USERNAMES) {
			const randomId = Math.random().toString(36).substring(2, 10);

			const res = await agent.post('/api/v1/admin/create-user').send({
				username,
				email: `user_${randomId}@test.com`,
				password: 'Password123!',
			});

			expect(res.statusCode).toEqual(409);
			expect(res.body).toHaveProperty('success', false);
			expect(res.body).toHaveProperty('error');
			expect(res.body.error).toHaveProperty(
				'message',
				`The chosen username "${username}" is not allowed`,
			);
		}
	});

	it('shouldnt allow creating users with duplicate usernames', async () => {
		const admin = await createTestUser({role: 'ADMIN'});
		await loginWithAgent(agent, admin.email, admin.password);

		const user = await createTestUser();

		// Try to create another user with the same username but different email
		const res = await agent.post('/api/v1/admin/create-user').send({
			username: user.username,
			email: 'different@test.com',
			password: user.password,
		});

		expect(res.statusCode).toEqual(409);
		expect(res.body).toHaveProperty('success', false);
		expect(res.body).toHaveProperty('error');
		expect(res.body.error).toHaveProperty('message', 'Username already taken');
	});

	it('shouldnt allow creating users with duplicate emails', async () => {
		const admin = await createTestUser({role: 'ADMIN'});
		await loginWithAgent(agent, admin.email, admin.password);

		const user = await createTestUser();

		// Try to create another user with the same email but different username
		const res = await agent.post('/api/v1/admin/create-user').send({
			username: 'differentUsername',
			email: user.email,
			password: user.password,
		});

		expect(res.statusCode).toEqual(409);
		expect(res.body).toHaveProperty('success', false);
		expect(res.body).toHaveProperty('error');
		expect(res.body.error).toHaveProperty(
			'message',
			'Email already registered',
		);
	});

	it('should convert username and email to lowercase when creating a user', async () => {
		const admin = await createTestUser({role: 'ADMIN'});
		await loginWithAgent(agent, admin.email, admin.password);

		const res = await agent.post('/api/v1/admin/create-user').send({
			username: 'TestUserUpper',
			email: 'user@Test.com',
			password: 'Password123!',
		});

		expect(res.statusCode).toEqual(201);
		expect(res.body).toHaveProperty('success', true);
		expect(res.body.data).toHaveProperty('username', 'testuserupper');
		expect(res.body.data).toHaveProperty('email', 'user@test.com');
	});
});
