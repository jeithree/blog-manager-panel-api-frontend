import {z} from 'zod';

export const createBlogSchema = z.object({
	title: z
		.string()
		.min(1, 'Title is required')
		.max(200, 'Title must be at most 200 characters'),
	domain: z
		.string()
		.min(1, 'Slug is required')
		.max(100, 'Slug must be at most 100 characters'),
	description: z
		.string()
		.max(500, 'Description must be at most 500 characters'),
	netlifySiteId: z.string(),
	R2BucketName: z.string(),
    R2CustomDomain: z.url(),
});
export type CreateBlogDto = z.infer<typeof createBlogSchema>;

export const updateBlogSchema = createBlogSchema
	.partial()
	.refine((data) => Object.values(data).some((value) => value !== undefined), {
		message: 'At least one field is required to update the blog',
	});

export type UpdateBlogDto = z.infer<typeof updateBlogSchema>;
