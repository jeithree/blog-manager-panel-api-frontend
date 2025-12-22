import {Router} from 'express';
import {validateQuery, validateBody} from '../middlewares/validation.ts';
import {getCategoriesQuerySchema} from '../types/category.ts';
import {isAuthenticated} from '../middlewares/auth.ts';
import {createCategorySchema} from '../types/category.ts';
import * as categoryController from '../controllers/categoryController.ts';

const router = Router();

router.get(
	'/',
	isAuthenticated,
	validateQuery(getCategoriesQuerySchema),
	categoryController.getCategories
);

router.post(
	'/',
	isAuthenticated,
	validateBody(createCategorySchema),
	categoryController.createCategory
);

export default router;
