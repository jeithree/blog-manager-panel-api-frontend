import type {Request, Response, NextFunction} from 'express';
import {AppError} from '../lib/appError.ts';
import * as Logger from '../helpers/logger.ts';

export const errorHandler = async (
	err: Error | AppError,
	_req: Request,
	res: Response,
	_next: NextFunction
) => {
	if (err instanceof AppError) {
		return res.status(err.statusCode).json({
			success: false,
			error: {
				code: err.errorCode,
				message: err.message,
			},
		});
	}

	// Unknown error
	await Logger.log(`Unhandled error: ${err.stack || err.message}`, 'error');
	return res.status(500).json({
		success: false,
		error: {
			code: 'INTERNAL_SERVER_ERROR',
			message: 'An unexpected error occurred',
		},
	});
};
