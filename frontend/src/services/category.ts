import {apiFetch} from '@/lib/fetcher';
import {API_URL} from '@/config';

export type Category = {
	id: string;
	name: string;
	blogId: string;
	createdAt: string;
	updatedAt: string;
};

export type CreateCategoryData = {
	name: string;
	blogId: string;
};

export type GetCategoriesParams = {
	blogId: string;
};

export const categoryService = {
	async createCategory(data: CreateCategoryData) {
		return apiFetch<Category>(`${API_URL}/api/v1/categories`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	async getCategories(params: GetCategoriesParams) {
		const queryParams = new URLSearchParams(
			Object.entries(params).filter(([, value]) => value !== undefined)
		);
		return apiFetch<Category[]>(
			`${API_URL}/api/v1/categories?${queryParams}`
		);
	},
};
