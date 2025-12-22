import {apiFetch} from '@/lib/fetcher';
import {API_URL} from '@/config';

export type Author = {
	id: string;
	name: string;
	blogId: string;
	createdAt: string;
	updatedAt: string;
};

export type CreateAuthorData = {
	name: string;
	blogId: string;
};

export const authorService = {
	async getAuthors(blogId?: string) {
		const query = blogId ? `?blogId=${blogId}` : '';
		return apiFetch<Author[]>(`${API_URL}/api/v1/authors${query}`);
	},

	async createAuthor(data: CreateAuthorData) {
		return apiFetch<Author>(`${API_URL}/api/v1/authors`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},
};
