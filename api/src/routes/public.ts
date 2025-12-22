import {Router} from 'express';
import {validateQuery} from '../middlewares/validation.ts';
import {getPostByIdQuerySchema, getPostsQuerySchema} from '../types/post.ts';
import {getCategoriesQuerySchema} from '../types/category.ts';
import {getTagsQuerySchema} from '../types/tag.ts';
import {hasApiKey} from '../middlewares/auth.ts';
import * as postController from '../controllers/postController.ts';
import * as categoryController from '../controllers/categoryController.ts';
import * as tagController from '../controllers/tagController.ts';
import * as blogController from '../controllers/blogController.ts';

const router = Router();

router.get(
	'/posts',
	hasApiKey,
	validateQuery(getPostsQuerySchema),
	postController.getPublicPosts
);

router.get(
	'/posts/:slug',
	hasApiKey,
	validateQuery(getPostByIdQuerySchema),
	postController.getPublicPostBySlug
);

router.get(
	'/categories',
	hasApiKey,
	validateQuery(getCategoriesQuerySchema),
	categoryController.getPublicCategories
);

router.get(
	'/tags',
	hasApiKey,
	validateQuery(getTagsQuerySchema),
	tagController.getPublicTags
);

router.get('/blogs/:blogId', hasApiKey, blogController.getPublicBlog);

export default router;
