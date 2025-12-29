import {apiFetch} from '@/lib/fetcher';
import {API_URL} from '@/config';

export type Prompt = {
	id: string;
	name: string;
	content: string;
	blogId: string;
	createdAt: string;
	updatedAt: string;
};

export type CreatePromptData = {
	name: string;
	content: string;
	blogId: string;
};

export type UpdatePromptData = Partial<{
	name: string;
	content: string;
}>;

export const promptService = {
	async createPrompt(data: CreatePromptData) {
		return apiFetch<Prompt>(`${API_URL}/api/v1/prompts`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	async getPrompts(params: {blogId: string}) {
		const qs = new URLSearchParams(Object.entries(params)).toString();
		return apiFetch<Prompt[]>(`${API_URL}/api/v1/prompts?${qs}`);
	},

	async updatePrompt(id: string, data: UpdatePromptData) {
		return apiFetch<Prompt>(`${API_URL}/api/v1/prompts/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	},
};
