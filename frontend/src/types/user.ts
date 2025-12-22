import {z} from 'zod';

export const updateProfileSchema = z.object({
	name: z.string().optional(),
	avatar: z.url().optional(),
	currentPassword: z
		.string()
		.min(8, 'Current password must be at least 8 characters')
		.optional(),
	newPassword: z
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
		)
		.optional(),
}).superRefine((data, ctx) => {
		const hasCurrent = !!data.currentPassword;
		const hasNew = !!data.newPassword;

		if (hasCurrent && !hasNew) {
			ctx.addIssue({
				code: 'custom',
				message: 'New password is required when providing current password',
				path: ['newPassword'],
			});
		}

		if (hasNew && !hasCurrent) {
			ctx.addIssue({
				code: 'custom',
				message: 'Current password is required to set a new password',
				path: ['currentPassword'],
			});
		}
	});

export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type UserResponse = {
	id: string;
	username: string;
	email: string;
	name?: string;
	avatar?: string;
	role: 'USER' | 'ADMIN';
	createdAt: string;
};
