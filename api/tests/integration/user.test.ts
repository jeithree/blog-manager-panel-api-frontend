import {describe, it, expect, afterAll, beforeAll} from 'vitest';
import request from 'supertest';
import app from '../../src/app.ts';
import prisma from '../../src/prisma.ts';

const registerTestUser = async (user: {
	username: string;
	email: string;
	password: string;
}) => {
	await request(app).post('/api/v1/auth/register').send(user);
};

const loginAndGetSession = async (email: string, password: string) => {
	const res = await request(app).post('/api/v1/auth/login').send({email, password});
	const sessionId = res.headers['set-cookie'][0].split(';')[0].split('=')[1];
	return sessionId;
};

const logout = async (sessionId: string) => {
	await request(app)
		.post('/api/v1/auth/logout')
		.set('Cookie', `connect.sid=${sessionId}`);
};

describe('User Integration Tests', () => {
	const testUser = {
		username: 'testuser',
		email: 'test@email.com',
		password: 'Password123!',
	};

	let sessionId = '';

	beforeAll(async () => {
		try {
			await registerTestUser(testUser);
		} catch (error) {
			console.log(error);
		}
	});

	afterAll(async () => {
		try {
			await logout(sessionId);
			await prisma.user.delete({where: {email: testUser.email}});
		} catch (error) {
			console.log(error);
		}
	});

	it('should get user Data by ID', async () => {
		sessionId = await loginAndGetSession(testUser.email, testUser.password);
		const res = await request(app)
			.get('/api/v1/users/me')
			.set('Cookie', [`sid=${sessionId}`]);

		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('success', true);
		expect(res.body.data.user).toStrictEqual({
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
            .set('Cookie', [`sid=${sessionId}`])
            .send({
                name: 'Updated Name',
                avatar: 'https://example.com/avatar.png',
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Profile updated successfully');
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data.user).toStrictEqual({
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
