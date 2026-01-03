import {PostStatus} from '@prisma/client';
import {z} from 'zod';

const parseArrayField = (val: unknown) => {
	if (typeof val === 'string') {
		try {
			const parsed = JSON.parse(val);
			return parsed;
		} catch (_err) {
			// fall through
		}
	}
	return val;
};

export const createPostSchema = z.object({
	blogId: z.string().min(1, 'Blog ID is required'),
	title: z
		.string()
		.min(1, 'Title is required')
		.max(200, 'Title must be at most 200 characters'),
	description: z
		.string()
		.min(1, 'Description is required')
		.max(500, 'Description must be at most 500 characters')
		.optional(),
	slug: z
		.string()
		.min(1, 'Slug is required')
		.max(150, 'Slug must be at most 150 characters'),
	imageUrl: z.string().min(1, 'Image URL is required').optional(),
	content: z.string().min(1, 'Content is required').optional(),
	AIGeneratedImagePrompt: z.string().optional(),
	categoryId: z.string().min(1, 'Category ID is required'),
	authorId: z.string().min(1, 'Author ID is required'),
	tagIds: z
		.preprocess(
			parseArrayField,
			z.array(z.string().min(1, 'Tag ID is required'))
		)
		.optional(),
	status: z.enum(PostStatus),
	publishedAt: z.coerce.date().optional(),
});

export type CreatePostDto = z.infer<typeof createPostSchema>;

export const getPostsQuerySchema = z.object({
	blogId: z.string().min(1, 'Blog ID is required'),
	categoryId: z.string().min(1, 'Category ID is required').optional(),
	tagId: z.string().min(1, 'Tag ID is required').optional(),
	status: z.enum(PostStatus).optional(),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type GetPostsQueryDto = z.infer<typeof getPostsQuerySchema>;

export const getPostByIdQuerySchema = z.object({
	blogId: z.string().min(1, 'Blog ID is required'),
});

export type GetPostByIdQueryDto = z.infer<typeof getPostByIdQuerySchema>;

export const updatePostSchema = z
	.object({
		blogId: z.string().min(1, 'Blog ID is required'),
		title: z
			.string()
			.min(1, 'Title is required')
			.max(200, 'Title must be at most 200 characters')
			.optional(),
		description: z
			.string()
			.min(1, 'Description is required')
			.max(500, 'Description must be at most 500 characters')
			.optional(),
		slug: z
			.string()
			.min(1, 'Slug is required')
			.max(150, 'Slug must be at most 150 characters')
			.optional(),
		imageUrl: z.string().min(1, 'Image URL is required').optional(),
		content: z.string().min(1, 'Content is required').optional(),
		AIGeneratedImagePrompt: z.string().optional(),
		categoryId: z.string().min(1, 'Category ID is required').optional(),
		authorId: z.string().min(1, 'Author ID is required').optional(),
		tagIds: z
			.preprocess(
				parseArrayField,
				z.array(z.string().min(1, 'Tag ID is required'))
			)
			.optional(),
		status: z.enum(PostStatus).optional(),
		publishedAt: z.coerce.date().optional(),
	})
	.refine(
		({blogId, ...rest}) =>
			Object.values(rest).some((value) => value !== undefined),
		{
			message: 'At least one field is required to update the post',
			path: ['title'],
		}
	);

export type UpdatePostDto = z.infer<typeof updatePostSchema>;
