import {Router} from 'express';
import {validateBody} from '../middlewares/validation.ts';
import {isAuthenticated} from '../middlewares/auth.ts';
import {updateProfileSchema} from '../types/user.ts';
import * as userController from '../controllers/userController.ts';

const router = Router();

router.get('/me', isAuthenticated, userController.getMe);
router.patch(
	'/me',
	isAuthenticated,
	validateBody(updateProfileSchema),
	userController.updateMe
);

export default router;
