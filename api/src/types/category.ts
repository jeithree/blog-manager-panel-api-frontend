import {z} from 'zod';

export const createCategorySchema = z.object({
	blogId: z.string().min(1, 'Blog ID is required'),
	name: z
		.string()
		.min(1, 'Category name is required')
		.max(100, 'Category name must be at most 100 characters'),
	slug: z
		.string()
		.min(1, 'Category slug is required')
		.max(100, 'Category slug must be at most 100 characters'),
	description: z
		.string()
		.max(300, 'Category description must be at most 300 characters'),
});
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

export const getCategoriesQuerySchema = z.object({
	blogId: z.string().min(1, 'Blog ID is required'),
});

export type GetCategoriesQueryDto = z.infer<typeof getCategoriesQuerySchema>;
