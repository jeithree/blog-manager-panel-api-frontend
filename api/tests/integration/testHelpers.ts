import request from 'supertest';
import app from '../../src/app.ts';

export const registerTestUser = async (user: {
	username: string;
	email: string;
	password: string;
    role?: string;
}) => {
	await request(app).post('/api/v1/auth/register').send(user);
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
