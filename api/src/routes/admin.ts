import {Router} from 'express';
import {validateBody} from '../middlewares/validation.ts';
import {isAuthenticated, isAdmin} from '../middlewares/auth.ts';
import {createUserSchema} from '../types/admin.ts';
import * as rateLimitMiddleware from '../middlewares/rateLimit.ts';
import * as adminController from '../controllers/adminController.ts';

const router = Router();

router.post(
    '/create-user',
    rateLimitMiddleware.createUserLimiter,
    isAuthenticated,
    isAdmin,
    validateBody(createUserSchema),
    adminController.createUser
);

export default router;
