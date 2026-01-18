import {describe, it, expect, afterEach, beforeEach} from 'vitest';
import request from 'supertest';
import app from '../../src/app.ts';
import {
	createTestUser,
	loginWithAgent,
	clearRedisSessions,
	clearUserTable,
} from './testHelpers.ts';

describe('User Integration Tests', () => {
	let agent: ReturnType<typeof request.agent>;

	beforeEach(async () => {
		agent = request.agent(app);
	});

	afterEach(async () => {
		await clearRedisSessions();
		await clearUserTable();
	});

	it('should get user Data by ID', async () => {
		const user = await createTestUser();
		await loginWithAgent(agent, user.email, user.password);

		const res = await agent.get('/api/v1/users/me');

		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('success', true);
		expect(res.body.data).toStrictEqual({
			id: expect.any(String),
			username: user.username,
			email: user.email,
			name: null,
			avatar: null,
			role: 'USER',
			createdAt: expect.any(String),
			updatedAt: expect.any(String),
		});
	});

	it('should update user profile', async () => {
		const user = await createTestUser();
		await loginWithAgent(agent, user.email, user.password);

		const res = await agent.patch('/api/v1/users/me').send({
			name: 'Updated Name',
			avatar: 'https://example.com/avatar.png',
		});

		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('message', 'Profile updated successfully');
		expect(res.body).toHaveProperty('success', true);
		expect(res.body.data).toStrictEqual({
			id: expect.any(String),
			username: user.username,
			email: user.email,
			name: 'Updated Name',
			avatar: 'https://example.com/avatar.png',
			role: 'USER',
			updatedAt: expect.any(String),
		});
	});
});
