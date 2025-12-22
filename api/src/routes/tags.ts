import {Router} from 'express';
import {validateQuery, validateBody} from '../middlewares/validation.ts';
import {getTagsQuerySchema} from '../types/tag.ts';
import {isAuthenticated} from '../middlewares/auth.ts';
import {createTagSchema} from '../types/tag.ts';
import * as tagController from '../controllers/tagController.ts';

const router = Router();

router.get(
	'/',
	isAuthenticated,
	validateQuery(getTagsQuerySchema),
	tagController.getTags
);

router.post(
	'/',
	isAuthenticated,
	validateBody(createTagSchema),
	tagController.createTag
);

export default router;
