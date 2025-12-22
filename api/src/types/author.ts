import {z} from 'zod';

export const createAuthorSchema = z.object({
	blogId: z.string().min(1, 'Blog ID is required'),
	name: z
		.string()
		.min(1, 'Author name is required')
		.max(100, 'Author name must be at most 100 characters'),
	slug: z
		.string()
		.min(1, 'Author slug is required')
		.max(100, 'Author slug must be at most 100 characters'),
	bio: z
		.string()
		.max(500, 'Author bio must be at most 500 characters')
		.optional(),
	avatar: z.url('Avatar must be a valid URL').optional(),
});
export type CreateAuthorDto = z.infer<typeof createAuthorSchema>;

export const getAuthorsSchema = z.object({
    blogId: z.string().min(1, 'Blog ID is required'),
});
export type GetAuthorsDto = z.infer<typeof getAuthorsSchema>;
