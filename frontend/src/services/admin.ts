import {apiFetch} from '@/lib/fetcher';
import type {AdminUser, CreateUserInput} from '@/types/admin';

export async function createUser(data: CreateUserInput) {
	return apiFetch<AdminUser>('/api/v1/admin/create-user', {
		method: 'POST',
		body: JSON.stringify(data),
	});
}
