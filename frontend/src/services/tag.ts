import {apiFetch} from '@/lib/fetcher';
import {API_URL} from '@/config';

export type Tag = {
	id: string;
	name: string;
	blogId: string;
	createdAt: string;
	updatedAt: string;
}

export type CreateTagData = {
	name: string;
	blogId: string;
}

export type GetTagsParams = {
	blogId: string;
}

export const tagService = {
	async createTag(data: CreateTagData) {
		return apiFetch<Tag>(`${API_URL}/api/v1/tags`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	async getTags(params: GetTagsParams) {
		const queryParams = new URLSearchParams(
			Object.entries(params).filter(([, value]) => value !== undefined)
		);
		return apiFetch<Tag[]>(`${API_URL}/api/v1/tags?${queryParams}`);
	},
};
