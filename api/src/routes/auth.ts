import {Router} from 'express';
import {validateBody} from '../middlewares/validation.ts';
import {isAuthenticated, isNotAuthenticated} from '../middlewares/auth.ts';
import {registerSchema, loginSchema} from '../types/auth.ts';
import * as rateLimitMiddleware from '../middlewares/rateLimit.ts';
import * as authController from '../controllers/authController.ts';

const router = Router();

router.post(
	'/register',
	rateLimitMiddleware.registerLimiter,
	isNotAuthenticated,
	validateBody(registerSchema),
	authController.register
);
router.post(
	'/login',
	rateLimitMiddleware.loginLimiter,
	isNotAuthenticated,
	validateBody(loginSchema),
	authController.login
);
router.post('/logout', isAuthenticated, authController.logout);
router.get('/session', authController.getSession);

export default router;
