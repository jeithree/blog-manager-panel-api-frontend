if (!process.env.PORT) {
	throw new Error('PORT is not defined in environment variables');
}
if (!process.env.DEV_MODE) {
	throw new Error('DEV_MODE is not defined in environment variables');
}
if (!process.env.API_URL) {
	throw new Error('API_URL is not defined in environment variables');
}
if (!process.env.SITE_URL) {
    throw new Error('SITE_URL is not defined in environment variables');
}
if (!process.env.TIME_ZONE) {
	throw new Error('TIME_ZONE is not defined in environment variables');
}
if (!process.env.SESSION_NAME) {
	throw new Error('SESSION_NAME is not defined in environment variables');
}
if (!process.env.SESSION_SECRET) {
	throw new Error('SESSION_SECRET is not defined in environment variables');
}
if (!process.env.SESSION_MAX_AGE) {
	throw new Error('SESSION_MAX_AGE is not defined in environment variables');
}
if (!process.env.SESSION_REDIS_PREFIX) {
	throw new Error(
		'SESSION_REDIS_PREFIX is not defined in environment variables'
	);
}

export const PORT = Number(process.env.PORT);
export const DEV_MODE = process.env.DEV_MODE === 'true';
export const API_URL = DEV_MODE
	? 'http://localhost:' + PORT
	: process.env.API_URL;
export const TIME_ZONE = process.env.TIME_ZONE;
export const SITE_URL = process.env.SITE_URL;
export const SESSION_NAME = process.env.SESSION_NAME;
export const SESSION_SECRET = process.env.SESSION_SECRET;
export const SESSION_MAX_AGE = Number(process.env.SESSION_MAX_AGE);
export const SESSION_PREFIX = process.env.SESSION_REDIS_PREFIX;

if (!process.env.REDIS_HOST) {
	throw new Error('REDIS_HOST is not defined in environment variables');
}
if (!process.env.REDIS_PORT) {
	throw new Error('REDIS_PORT is not defined in environment variables');
}
if (!process.env.REDIS_PASSWORD) {
	throw new Error('REDIS_PASSWORD is not defined in environment variables');
}

export const REDIS_HOST = process.env.REDIS_HOST;
export const REDIS_PORT = Number(process.env.REDIS_PORT);
export const REDIS_URL = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

if (!process.env.OPENAI_API_KEY) {
	throw new Error('OPENAI_API_KEY is not defined in environment variables');
}
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!process.env.NETLIFY_TOKEN) {
	throw new Error('NETLIFY_TOKEN is not defined in environment variables');
}
export const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN;

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not defined in environment variables');
}
export const DATABASE_URL = process.env.DATABASE_URL;

// R2 cloudflare
if (!process.env.R2_ACCESS_KEY_ID) {
	throw new Error('R2_ACCESS_KEY_ID is not defined in environment variables');
}
if (!process.env.R2_SECRET_ACCESS_KEY) {
	throw new Error(
		'R2_SECRET_ACCESS_KEY is not defined in environment variables'
	);
}
if (!process.env.R2_ACCOUNT_ID) {
	throw new Error('R2_ACCOUNT_ID is not defined in environment variables');
}
export const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
export const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
export const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
