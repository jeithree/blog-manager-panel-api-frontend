import {apiFetch} from '@/lib/fetcher';
import type {LoginData, RegisterData} from '@/types/auth';
import type {UserResponse} from '@/types/user';
import type {SessionResponse} from '@/types/session';

export async function register(data: RegisterData) {
	return apiFetch<UserResponse>('/api/v1/auth/register', {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function login(data: LoginData) {
	return apiFetch<UserResponse>('/api/v1/auth/login', {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export async function logout() {
	return apiFetch('/api/v1/auth/logout', {
		method: 'POST',
	});
}

export async function getSession() {
	return apiFetch<SessionResponse>('/api/v1/auth/session');
}
