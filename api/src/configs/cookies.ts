import {DEV_MODE, SESSION_NAME, SESSION_MAX_AGE} from './basics.ts';

export const SESSION_COOKIE = {
	name: SESSION_NAME,
	options: {
		secure: DEV_MODE ? false : true,
		httpOnly: true,
		sameSite: 'lax' as const,
		path: '/',
	},
	maxAge: SESSION_MAX_AGE,
};
