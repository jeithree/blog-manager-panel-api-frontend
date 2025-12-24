import {apiFetch} from '@/lib/fetcher';
import {API_URL} from '@/config';

export type TitleSuggestion = {
	category: string;
	titles: string[];
	categoryId: string;
};

export type GeneratePostContentData = {
	blogId: string;
	categoryId: string;
	title: string;
};

export type GeneratedContent = {
	blogId: string;
	title: string;
	description: string;
	slug: string;
	content: string;
	categoryId: string;
	tagNames: string[];
};

export type GeneratePostEditData = {
	blogId: string;
	postId: string;
	changeRequest: string;
};

export type GeneratePostEdit = {
	blogId: string;
	postId: string;
	content: string;
};

export type GenerateImagePromptData = {
	blogPost: string;
};

export const creatorService = {
	async generateTitleSuggestions(blogId: string) {
		return apiFetch<TitleSuggestion[]>(
			`${API_URL}/api/v1/creator/generate-title-suggestions`,
			{
				method: 'POST',
				body: JSON.stringify({blogId}),
			}
		);
	},

	async generatePostContent(data: GeneratePostContentData) {
		return apiFetch<GeneratedContent>(
			`${API_URL}/api/v1/creator/generate-post-content`,
			{
				method: 'POST',
				body: JSON.stringify(data),
			}
		);
	},

	async generatePostEdit(data: GeneratePostEditData) {
		return apiFetch<GeneratePostEdit>(
			`${API_URL}/api/v1/creator/generate-post-edit`,
			{
				method: 'POST',
				body: JSON.stringify(data),
			}
		);
	},

	async generateImagePrompt(data: GenerateImagePromptData) {
		return apiFetch<{imagePrompt: string}>(
			`${API_URL}/api/v1/creator/generate-image-prompt`,
			{
				method: 'POST',
				body: JSON.stringify(data),
			}
		);
	},
};
