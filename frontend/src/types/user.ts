import {z} from 'zod';

export const updateProfileSchema = z.object({
	name: z.string().optional(),
	avatar: z.url().optional(),
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
