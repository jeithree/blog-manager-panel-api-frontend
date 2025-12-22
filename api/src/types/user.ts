import {z} from 'zod';

export const updateProfileSchema = z.object({
	name: z.string().optional(),
	avatar: z.url().optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;