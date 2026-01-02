import {Router} from 'express';
import {validateBody, validateQuery} from '../middlewares/validation.ts';
import {
	createPromptSchema,
	getPromptsQuerySchema,
	updatePromptSchema,
} from '../types/prompt.ts';
import {isAuthenticated} from '../middlewares/auth.ts';
import * as promptController from '../controllers/promptController.ts';

const router = Router();

router.get(
	'/',
	isAuthenticated,
	validateQuery(getPromptsQuerySchema),
	promptController.getPrompts
);

router.post(
	'/',
	isAuthenticated,
	validateBody(createPromptSchema),
	promptController.createPrompt
);

router.put(
	'/:id',
	isAuthenticated,
	validateBody(updatePromptSchema),
	promptController.updatePrompt
);

export default router;
