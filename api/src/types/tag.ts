import {z} from 'zod';

export const createTagSchema = z.object({
	blogId: z.string().min(1, 'Blog ID is required'),
	name: z
		.string()
		.min(1, 'Tag name is required')
		.max(100, 'Tag name must be at most 100 characters'),
	slug: z
		.string()
		.min(1, 'Tag slug is required')
		.max(100, 'Tag slug must be at most 100 characters'),
});

export type CreateTagDto = z.infer<typeof createTagSchema>;

export const getTagsQuerySchema = z.object({
	blogId: z.string().min(1, 'Blog ID is required'),
});

export type GetTagsQueryDto = z.infer<typeof getTagsQuerySchema>;
