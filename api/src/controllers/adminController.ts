import type {Request, Response, NextFunction} from 'express';
import type {CreateUserDto} from '../types/admin.ts';
import * as adminService from '../services/adminService.ts';
import {successResponse} from '../lib/apiResponse.ts';

export const createUser = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const data = req.body as CreateUserDto;
		const user = await adminService.createUser(data);

		return res
			.status(201)
			.json(successResponse('User created successfully', user));
	} catch (error) {
		return next(error);
	}
};
