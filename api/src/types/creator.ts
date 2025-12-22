import {z} from 'zod';

export const generatePostContentSchema = z.object({
	blogId: z.string().min(1, 'Blog ID is required'),
	categoryId: z.string().min(1, 'Category is required'),
	title: z
		.string()
		.min(1, 'Title is required')
		.max(200, 'Title must be at most 200 characters'),
});
export type GeneratePostContentDto = z.infer<typeof generatePostContentSchema>;

export const generatePostEditSchema = z.object({
	blogId: z.string().min(1, 'Blog ID is required'),
	postId: z.string().min(1, 'Post ID is required'),
	changeRequest: z
		.string()
		.min(1, 'Change request is required')
		.max(1000, 'Change request must be at most 1000 characters'),
});
export type GeneratePostEditDto = z.infer<typeof generatePostEditSchema>;

export const generateImagePromptSchema = z.object({
	blogPost: z.string().min(1, 'Blog post content is required'),
});
export type GenerateImagePromptDto = z.infer<typeof generateImagePromptSchema>;
