import {apiFetch} from '@/lib/fetcher';
import {API_URL} from '@/config';

export enum PostStatus {
	DRAFT = 'DRAFT',
	SCHEDULED = 'SCHEDULED',
	PUBLISHED = 'PUBLISHED',
}

export type Post = {
	id: string;
	blogId: string;
	title: string;
	description?: string;
	slug: string;
	imageUrl?: string;
	content?: string;
	categoryId: string;
	authorId: string;
	status: PostStatus;
	publishedAt?: string;
	createdAt: string;
	updatedAt: string;
	tags?: {id: string; name: string}[];
	category?: {id: string; name: string};
	author?: {id: string; name: string};
}

export type CreatePostData = {
	blogId: string;
	title: string;
	description?: string;
	slug: string;
	imageUrl?: string;
	content?: string;
	categoryId: string;
	authorId: string;
	tagIds?: string[];
}

export type UpdatePostData = {
	blogId: string;
	title?: string;
	description?: string;
	slug?: string;
	imageUrl?: string;
	content?: string;
	categoryId?: string;
	authorId?: string;
	tagIds?: string[];
	status?: PostStatus;
	publishedAt?: Date;
}

export type GetPostsParams = {
	blogId: string;
	categoryId?: string;
	tagId?: string;
    status?: PostStatus;
	page?: number;
	pageSize?: number;
}

export type PostsResponse = {
	posts: Post[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export const postService = {
	async createPost(data: CreatePostData, imageFile?: File) {
		const formData = new FormData();
		Object.entries(data).forEach(([key, value]) => {
			if (value !== undefined) {
				if (Array.isArray(value)) {
					formData.append(key, JSON.stringify(value));
				} else {
					formData.append(key, String(value));
				}
			}
		});

		if (imageFile) {
			formData.append('imageUrl', imageFile);
		}

		const response = await fetch(`${API_URL}/api/v1/posts`, {
			method: 'POST',
			body: formData,
			credentials: 'include',
		});

		return response.json();
	},

	async getPosts(params: GetPostsParams) {
		const queryParams = new URLSearchParams();
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined) {
				queryParams.append(key, String(value));
			}
		});

		return apiFetch<PostsResponse>(`${API_URL}/api/v1/posts?${queryParams}`);
	},

	async getPostBySlug(slug: string, blogId: string) {
		return apiFetch<Post>(`${API_URL}/api/v1/posts/${slug}?blogId=${blogId}`);
	},

	async getPostById(postId: string, blogId: string) {
		return apiFetch<Post>(
			`${API_URL}/api/v1/posts/id/${postId}?blogId=${blogId}`
		);
	},

	async updatePost(postId: string, data: UpdatePostData, imageFile?: File) {
		const formData = new FormData();
		Object.entries(data).forEach(([key, value]) => {
			if (value !== undefined) {
				if (Array.isArray(value)) {
					formData.append(key, JSON.stringify(value));
				} else if (value instanceof Date) {
					formData.append(key, value.toISOString());
				} else {
					formData.append(key, String(value));
				}
			}
		});

		if (imageFile) {
			formData.append('imageUrl', imageFile);
		}

		const response = await fetch(`${API_URL}/api/v1/posts/${postId}`, {
			method: 'PATCH',
			body: formData,
			credentials: 'include',
		});

		return response.json();
	},
};
