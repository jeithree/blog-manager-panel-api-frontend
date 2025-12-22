import {Router} from 'express';
import {validateBody} from '../middlewares/validation.ts';
import {isAuthenticated} from '../middlewares/auth.ts';
import {createBlogSchema, updateBlogSchema} from '../types/blog.ts';
import * as blogController from '../controllers/blogController.ts';

const router = Router();

router.get('/', isAuthenticated, blogController.getBlogs);

router.get('/:blogId', isAuthenticated, blogController.getBlog);

router.patch(
	'/:blogId',
	isAuthenticated,
	validateBody(updateBlogSchema),
	blogController.updateBlog
);

router.post(
	'/',
	isAuthenticated,
	validateBody(createBlogSchema),
	blogController.createBlog
);

export default router;
