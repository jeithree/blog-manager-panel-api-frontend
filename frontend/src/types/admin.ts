import {z} from 'zod';

export const createUserSchema = z.object({
	username: z
		.string()
		.min(3, 'Username must be at least 3 characters')
		.max(20, 'Username must be at most 20 characters')
		.regex(
			/^[a-zA-Z0-9_]+$/,
			'Username can only contain letters, numbers, and underscores'
		),
	email: z.email('Invalid email address'),
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.max(100, 'Password must be at most 100 characters')
		.refine(
			(val) => /[a-z]/.test(val),
			'Password must contain a lowercase letter'
		)
		.refine(
			(val) => /[A-Z]/.test(val),
			'Password must contain an uppercase letter'
		)
		.refine((val) => /[0-9]/.test(val), 'Password must contain a number')
		.refine(
			(val) => /[^a-zA-Z0-9]/.test(val),
			'Password must contain a special character'
		),
	name: z.string().max(100, 'Name must be at most 100 characters').optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export type AdminUser = {
	id: string;
	username: string;
	email: string;
	name?: string | null;
	role: 'USER';
	createdAt: string;
};
