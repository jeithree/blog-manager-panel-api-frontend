import {Router} from 'express';
import {validateBody, validateQuery} from '../middlewares/validation.ts';
import {
	createPromptSchema,
	getPromptsQuerySchema,
	updatePromptSchema,
} from '../types/prompt.ts';
import {isAdmin, isAuthenticated} from '../middlewares/auth.ts';
import * as promptController from '../controllers/promptController.ts';

const router = Router();

router.get(
	'/',
	isAuthenticated,
    isAdmin,
	validateQuery(getPromptsQuerySchema),
	promptController.getPrompts
);

router.post(
	'/',
	isAuthenticated,
    isAdmin,
	validateBody(createPromptSchema),
	promptController.createPrompt
);

router.put(
	'/:id',
	isAuthenticated,
    isAdmin,
	validateBody(updatePromptSchema),
	promptController.updatePrompt
);

export default router;
