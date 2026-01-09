import {apiFetch} from '@/lib/fetcher';
import {API_URL} from '@/config';

export type Blog = {
	id: string;
	userId: string;
	title: string;
	domain: string;
	description: string;
	netlifySiteId: string;
	apiKey: string;
	R2BucketName: string;
	R2CustomDomain: string;
	createdAt: string;
	updatedAt: string;
};

export type CreateBlogData = {
	title: string;
	domain: string;
	description: string;
	netlifySiteId: string;
	R2BucketName: string;
	R2CustomDomain: string;
};

export type UpdateBlogData = {
	title?: string;
	domain?: string;
	description?: string;
	netlifySiteId?: string;
	R2BucketName?: string;
	R2CustomDomain?: string;
};

export const blogService = {
	async getBlogs() {
		return apiFetch<Blog[]>(`${API_URL}/api/v1/blogs`);
	},

	async createBlog(data: CreateBlogData) {
		return apiFetch<Blog>(`${API_URL}/api/v1/blogs`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	async getBlog(blogId: string) {
		return apiFetch<Blog>(`${API_URL}/api/v1/blogs/${blogId}`);
	},

	async updateBlog(blogId: string, data: UpdateBlogData) {
		return apiFetch<Blog>(`${API_URL}/api/v1/blogs/${blogId}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
		});
	},
};
