import {v4 as uuidv4} from 'uuid';
import multer from 'multer';
import type {Request, Response, NextFunction} from 'express';
import {BadRequestError} from '../lib/appError.ts';

/**
 * Creates a multer middleware for image upload with memory storage
 * @param fieldName - The name of the form field containing the image
 * @returns Multer middleware configured for single image upload
 */
export const createImageUpload = (fieldName: string) => {
	const upload = multer({
		storage: multer.memoryStorage(),
		limits: {fileSize: 5 * 1024 * 1024}, // 5MB
		fileFilter: (_req, file, cb) => {
			const allowedMimeTypes = [
				'image/jpeg',
				'image/png',
				'image/gif',
				'image/webp',
			];
			if (allowedMimeTypes.includes(file.mimetype)) {
				cb(null, true);
			} else {
				cb(
					new BadRequestError(
						'Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.',
						'INVALID_FILE_TYPE'
					)
				);
			}
		},
	});

	return upload.single(fieldName);
};

/**
 * Middleware to generate filename and set it in req.body for Zod validation
 * Should be used after multer processes the image
 */
export const setImageFilename = (
	req: Request,
	_res: Response,
	next: NextFunction
) => {
	if (req.file) {
		req.body.imageUrl = uuidv4();
	}
	next();
};
