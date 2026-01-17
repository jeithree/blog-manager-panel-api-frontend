import type {Request, Response, NextFunction} from 'express';
import rateLimit from 'express-rate-limit';
import * as Logger from '../helpers/logger.ts';
import {RateLimitError} from '../lib/appError.ts';

export const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	handler: (req: Request, _res: Response, next: NextFunction) => {
		Logger.log(`Rate limit exceeded for login: ${req.ip}`, 'info');
		next(
			new RateLimitError(
				'You have exceeded the maximum number of login attempts. Please try again later.',
				'LOGIN_RATE_LIMIT_EXCEEDED'
			)
		);
	},
});

export const createUserLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 60,
	handler: (req: Request, _res: Response, next: NextFunction) => {
		Logger.log(`Rate limit exceeded for user creation: ${req.ip}`, 'info');
		next(
			new RateLimitError(
				'You have exceeded the maximum number of user creation attempts. Please try again later.',
				'CREATE_USER_RATE_LIMIT_EXCEEDED'
			)
		);
	},
});
