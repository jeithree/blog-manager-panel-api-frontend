import {IS_DEV_MODE, IS_TEST_MODE} from './basics.ts';

export const SESSION_COOKIE = {
	name: 'sid',
	options: {
		secure: IS_DEV_MODE || IS_TEST_MODE ? false : true,
		httpOnly: true,
		sameSite: 'lax' as const,
		path: '/',
	},
	maxAge: 1000 * 60 * 60 * 24 * 5, // 5 days
};
