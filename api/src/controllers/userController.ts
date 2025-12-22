import type {Request, Response, NextFunction} from 'express';
import type {UpdateProfileDto} from '../types/user.ts';
import * as authService from '../services/authService.ts';
import {successResponse} from '../lib/apiResponse.ts';
import {NotFoundError} from '../lib/appError.ts';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const userId = req.session.userId as string;
		const user = await authService.getUserById(userId);

		if (!user) {
			throw new NotFoundError('User not found');
		}

		return res.status(200).json(successResponse('User retrieved', user));
	} catch (error) {
		return next(error);
	}
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const userId = req.session.userId as string;
		const data = req.body as UpdateProfileDto;

		const user = await authService.updateUser(userId, data);
		return res.status(200).json(successResponse('Profile updated successfully', user));
	} catch (error) {
		return next(error);
	}
};
