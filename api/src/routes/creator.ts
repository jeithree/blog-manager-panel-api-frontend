import {Router} from 'express';
import {validateBody} from '../middlewares/validation.ts';
import {
	generatePostContentSchema,
	generateImagePromptSchema,
	generatePostEditSchema,
} from '../types/creator.ts';
import {isAuthenticated} from '../middlewares/auth.ts';
import * as creatorController from '../controllers/creatorController.ts';

const router = Router();

router.post(
	'/generate-title-suggestions',
	isAuthenticated,
	creatorController.generateTitleSuggestions
);

router.post(
	'/generate-post-content',
	isAuthenticated,
	validateBody(generatePostContentSchema),
	creatorController.generatePostContent
);

router.post(
	'/generate-post-edit',
	isAuthenticated,
	validateBody(generatePostEditSchema),
	creatorController.generatePostEdit
);

router.post(
	'/generate-image-prompt',
	isAuthenticated,
	validateBody(generateImagePromptSchema),
	creatorController.generateImagePrompt
);

export default router;
