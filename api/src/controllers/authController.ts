import type {Request, Response, NextFunction} from 'express';
import type {RegisterDto, LoginDto} from '../types/auth.ts';
import * as authService from '../services/authService.ts';
import {successResponse} from '../lib/apiResponse.ts';
import * as Logger from '../helpers/logger.ts';
import {SESSION_COOKIE} from '../configs/cookies.ts';

export const register = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const data = req.body as RegisterDto;
		const user = await authService.register(data);

		return res
			.status(201)
			.json(successResponse('User registered successfully', user));
	} catch (error) {
		return next(error);
	}
};

export const login = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const data = req.body as LoginDto;
		const user = await authService.login(data);

		// Set session
		req.session.userId = user.id;
		req.session.username = user.username;
		req.session.email = user.email;
		req.session.role = user.role;
		req.session.createdAt = new Date().toISOString();
		req.session.cookie.maxAge = SESSION_COOKIE.maxAge;

		return res.status(200).json(successResponse('Login successful', user));
	} catch (error) {
		return next(error);
	}
};

export const logout = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		req.session.destroy(async (err) => {
			if (err) {
				await Logger.logToFile(
					`Error destroying session in logout: ${err}`,
					'error'
				);
			}
		});

		res.clearCookie(SESSION_COOKIE.name, SESSION_COOKIE.options);

		return res.status(200).json(successResponse('Logout successful'));
	} catch (error) {
		return next(error);
	}
};

export const getSession = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		console.log('Session data:', req.session);
		return res.status(200).json(
			successResponse('Session retrieved', {
				isAuthenticated: !!req.session.userId,
				user: req.session.userId
					? {
							id: req.session.userId,
							username: req.session.username,
							email: req.session.email,
							role: req.session.role,
					  }
					: null,
			})
		);
	} catch (error) {
		return next(error);
	}
};
