import {Router} from 'express';
import {validateBody, validateQuery} from '../middlewares/validation.ts';
import {isAuthenticated} from '../middlewares/auth.ts';
import {createAuthorSchema, getAuthorsSchema} from '../types/author.ts';
import * as authorController from '../controllers/authorController.ts';

const router = Router();

router.post(
	'/',
	isAuthenticated,
	validateBody(createAuthorSchema),
	authorController.createAuthor
);

router.get(
	'/',
	isAuthenticated,
	validateQuery(getAuthorsSchema),
	authorController.getAuthors
);

export default router;
