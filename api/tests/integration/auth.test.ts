import {describe, it, expect, afterAll} from 'vitest';
import request from 'supertest';
import app from '../../src/app.ts';
import prisma from '../../src/prisma.ts';

describe('Authentication Integration Tests', () => {
	const testUser = {
		username: 'testuser',
		email: 'test@email.com',
		password: 'Password123!',
	};

	const testUser2 = {
		username: 'anotheruser',
		email: 'test2@email.com',
		password: 'Password123!',
	};

	let sessionId = '';

	afterAll(async () => {
		try {
			await prisma.user.delete({where: {email: testUser.email}});
		} catch (error) {
			console.log(error);
		}
	});

	it('should fail if username is not allowed when registering', async () => {
		const res = await request(app)
			.post('/api/v1/auth/register')
			.send({
				...testUser,
				username: 'administrator',
			});

		expect(res.statusCode).toEqual(409);
		expect(res.body).toStrictEqual({
			success: false,
			error: {
				message: 'The chosen username "administrator" is not allowed',
				code: 'CONFLICT',
			},
		});
	});

	it('should fail if a field is missing when registering', async () => {
		const res = await request(app).post('/api/v1/auth/register').send({
			username: 'testuser',
			password: 'Password123!',
		});

		expect(res.statusCode).toEqual(400);
		expect(res.body).toHaveProperty('success', false);
		expect(res.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
	});

	it('should register a new user', async () => {
		const res = await request(app).post('/api/v1/auth/register').send(testUser);

		expect(res.statusCode).toEqual(201);
		expect(res.body).toHaveProperty('message', 'User registered successfully');
		expect(res.body.data.user).toStrictEqual({
			id: expect.any(String),
			username: testUser.username,
			email: testUser.email,
			name: null,
			role: 'USER',
			createdAt: expect.any(String),
		});
	});

	it('should fail if username is already registered when registering', async () => {
		const res = await request(app).post('/api/v1/auth/register').send(testUser);

		expect(res.statusCode).toEqual(409);
		expect(res.body).toStrictEqual({
			success: false,
			error: {message: 'Username already taken', code: 'USERNAME_TAKEN'},
		});
	});

	it('should fail if email is already registered when registering', async () => {
		const res = await request(app)
			.post('/api/v1/auth/register')
			.send({...testUser, username: 'testuser1'});

		expect(res.statusCode).toEqual(409);
		expect(res.body).toStrictEqual({
			success: false,
			error: {message: 'Email already registered', code: 'EMAIL_TAKEN'},
		});
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
		expect(res.body.data.user).toStrictEqual({
			id: expect.any(String),
			username: testUser.username,
			email: testUser.email,
			name: null,
			role: 'USER',
		});
		expect(res.headers['set-cookie']).toBeDefined();
		sessionId = res.headers['set-cookie'][0].split(';')[0].split('=')[1];
	});

	it('should fail if registering a new user when there is an active session', async () => {
		const res = await request(app)
			.post('/api/v1/auth/register')
			.set('Cookie', [`sid=${sessionId}`])
			.send(testUser2);

		expect(res.statusCode).toEqual(401);
		expect(res.body).toStrictEqual({
			success: false,
			error: {
				message: 'You are already logged in',
				code: 'UNAUTHORIZED',
			},
		});
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
