import {z} from 'zod';

export const addBlogMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  // role should be EDITOR for assignments via UI; owner assignment not allowed here
  role: z.enum(['EDITOR']).optional(),
});
export type AddBlogMemberDto = z.infer<typeof addBlogMemberSchema>;
