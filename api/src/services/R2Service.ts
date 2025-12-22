import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import {
	R2_ACCESS_KEY_ID,
	R2_SECRET_ACCESS_KEY,
	R2_ACCOUNT_ID,
} from '../configs/basics.ts';
import {InternalServerError} from '../lib/appError.ts';
import * as Logger from '../helpers/logger.ts';

export const uploadImageToR2 = async (
	bucketName: string,
	buffer: Buffer,
	key: string
): Promise<string> => {
	const client = new S3Client({
		region: 'auto',
		endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: R2_ACCESS_KEY_ID,
			secretAccessKey: R2_SECRET_ACCESS_KEY,
		},
	});

	const optimizedBuffer = await optimizeBlogImage(buffer);

	const command = new PutObjectCommand({
		Bucket: bucketName,
		Key: `${key}.webp`,
		Body: optimizedBuffer,
		ContentType: 'image/webp',
		ACL: 'public-read',
	});

	const result = await client.send(command);

	if (result.$metadata.httpStatusCode === 200) {
		return `${key}.webp`;
	} else {
		throw new InternalServerError(
			'Failed to upload image to R2',
			'R2_UPLOAD_FAILED'
		);
	}
};

export const deleteImageFromR2 = async (
	bucketName: string,
	key: string
): Promise<void> => {
	const client = new S3Client({
		region: 'auto',
		endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: R2_ACCESS_KEY_ID,
			secretAccessKey: R2_SECRET_ACCESS_KEY,
		},
	});

	const command = new DeleteObjectCommand({
		Bucket: bucketName,
		Key: key,
	});

	const result = await client.send(command);
	if (result.$metadata.httpStatusCode !== 204) {
		await Logger.logToFile(
			`Failed to delete image ${key} from R2 bucket ${bucketName}`,
			'warn'
		);
	}
};

const optimizeBlogImage = async (buffer: Buffer) => {
	return sharp(buffer)
		.webp({
			quality: 82,
		})
		.toBuffer();
};
