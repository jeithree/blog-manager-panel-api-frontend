import type {Request, Response, NextFunction} from 'express';
import {UnauthorizedError} from '../lib/appError.ts';

export const isAuthenticated = (
	req: Request,
	_res: Response,
	next: NextFunction
) => {
	if (!req.session.userId) {
		return next(
			new UnauthorizedError('You must be logged in to access this resource')
		);
	}
	return next();
};

export const isNotAuthenticated = (
	req: Request,
	_res: Response,
	next: NextFunction
) => {
	if (req.session.userId) {
		return next(new UnauthorizedError('You are already logged in'));
	}
	return next();
};

export const isAdmin = (req: Request, _res: Response, next: NextFunction) => {
	if (req.session.role !== 'ADMIN') {
		return next(new UnauthorizedError('You do not have admin privileges'));
	}
	return next();
};

export const hasApiKey = async (
	req: Request,
	_res: Response,
	next: NextFunction
) => {
	const apiKey = req.header('x-api-key');
	if (!apiKey) {
		return next(new UnauthorizedError('API key is missing'));
	}
	return next();
};
