import type {Request, Response, NextFunction} from 'express';
import {BadRequestError} from '../lib/appError.ts';
import {z, ZodError} from 'zod';

export const validateBody = (schema: z.ZodSchema<any>) => {
	return async (req: Request, _res: Response, next: NextFunction) => {
		try {
			const body = schema.parse(req.body);
			Object.assign(req.body, body);
			return next();
		} catch (error) {
			if (error instanceof ZodError) {
				return next(
					new BadRequestError(
						error.issues?.[0]?.message || 'Validation failed',
						'VALIDATION_ERROR'
					)
				);
			} else {
				return next(
					new BadRequestError('Validation failed', 'VALIDATION_ERROR')
				);
			}
		}
	};
};

export const validateQuery = (schema: z.ZodSchema<any>) => {
	return async (req: Request, _res: Response, next: NextFunction) => {
		try {
			const query = schema.parse(req.query);
			Object.assign(req.query, query);
			return next();
		} catch (error) {
			if (error instanceof ZodError) {
				return next(
					new BadRequestError(
						error.issues?.[0]?.message || 'Validation failed',
						'VALIDATION_ERROR'
					)
				);
			} else {
				return next(
					new BadRequestError('Validation failed', 'VALIDATION_ERROR')
				);
			}
		}
	};
};
