import {Router} from 'express';
import authRoutes from './auth.ts';
import userRoutes from './users.ts';
import blogRoutes from './blogs.ts';
import categoryRoutes from './categories.ts';
import creatorRoutes from './creator.ts';
import tagRoutes from './tags.ts';
import authorRoutes from './authors.ts';
import postRoutes from './posts.ts';
import publicRoutes from './public.ts';

const router = Router();

router.use('/public', publicRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/blogs', blogRoutes);
router.use('/categories', categoryRoutes);
router.use('/creator', creatorRoutes);
router.use('/tags', tagRoutes);
router.use('/authors', authorRoutes);
router.use('/posts', postRoutes);

export default router;
