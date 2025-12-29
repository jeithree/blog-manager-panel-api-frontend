import {z} from 'zod';

export const createPromptSchema = z.object({
	blogId: z.string().min(1, 'Blog ID is required'),
	name: z
		.string()
		.min(1, 'Prompt name is required')
		.max(200, 'Prompt name too long'),
	content: z.string().min(1, 'Prompt content is required'),
});

export type CreatePromptDto = z.infer<typeof createPromptSchema>;

export const getPromptsQuerySchema = z.object({
	blogId: z.string().min(1, 'Blog ID is required'),
});

export type GetPromptsQueryDto = z.infer<typeof getPromptsQuerySchema>;

export const updatePromptSchema = z
	.object({
		name: z.string().min(1, 'Prompt name is required').max(200).optional(),
		content: z.string().min(1, 'Prompt content is required').optional(),
	})
	.refine((data) => !!(data.name || data.content), {
		message: 'At least one field (name or content) is required',
	});

export type UpdatePromptDto = z.infer<typeof updatePromptSchema>;
