import {z} from 'zod';

export const registerSchema = z.object({
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
			'Password must contain at least one lowercase letter'
		)
		.refine(
			(val) => /[A-Z]/.test(val),
			'Password must contain at least one uppercase letter'
		)
		.refine((val) => /[0-9]/.test(val), 'Password must contain at least one number')
		.refine(
			(val) => /[^a-zA-Z0-9]/.test(val),
			'Password must contain at least one special character'
		),
	name: z.string().max(100, 'Name must be at most 100 characters').optional(),
});

export const loginSchema = z.object({
	email: z.email('Invalid email address'),
	password: z.string().min(1, 'Password is required'),
});

export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
