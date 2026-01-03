import {apiFetch} from '@/lib/fetcher';
import {API_URL} from '@/config';

export type BlogMember = {
	id: string;
	role: 'OWNER' | 'EDITOR';
	user: {id: string; username: string; email: string; name?: string};
	createdAt: string;
};

export const blogMemberService = {
	listMembers(blogId: string) {
		return apiFetch<BlogMember[]>(`${API_URL}/api/v1/blogs/${blogId}/members`);
	},

	addMember(blogId: string, userId: string) {
		return apiFetch<BlogMember>(`${API_URL}/api/v1/blogs/${blogId}/members`, {
			method: 'POST',
			body: JSON.stringify({userId}),
		});
	},

	removeMember(blogId: string, userId: string) {
		return apiFetch(`${API_URL}/api/v1/blogs/${blogId}/members/${userId}`, {
			method: 'DELETE',
		});
	},
};
