import {Router} from 'express';
import {validateBody, validateQuery} from '../middlewares/validation.ts';
import {isAuthenticated} from '../middlewares/auth.ts';
import {
	createPostSchema,
	getPostByIdQuerySchema,
	getPostsQuerySchema,
	updatePostSchema,
} from '../types/post.ts';
import {
	createImageUpload,
	setImageFilename,
} from '../middlewares/imageUploadMiddleware.ts';
import * as postController from '../controllers/postController.ts';

const router = Router();

router.get(
	'/',
	isAuthenticated,
	validateQuery(getPostsQuerySchema),
	postController.getPosts
);

router.get(
	'/id/:postId',
	isAuthenticated,
	validateQuery(getPostByIdQuerySchema),
	postController.getPostById
);

router.patch(
	'/:postId',
	isAuthenticated,
	createImageUpload('imageUrl'),
	setImageFilename,
	validateBody(updatePostSchema),
	postController.updatePost
);

router.delete('/:postId', isAuthenticated, postController.deletePost);

router.post(
	'/',
	isAuthenticated,
	createImageUpload('imageUrl'),
	setImageFilename,
	validateBody(createPostSchema),
	postController.createPost
);

export default router;
