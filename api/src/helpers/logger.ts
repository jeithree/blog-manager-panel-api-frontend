import {DateTime} from 'luxon';
import {IS_DEV_MODE, TIME_ZONE} from '../configs/basics.ts';

type LogType = 'error' | 'warn' | 'info' | 'debug';

export const logToFile = async (error: unknown, type: LogType) => {
	const timestamp = DateTime.now()
		.setZone(TIME_ZONE)
		.toFormat('yyyy-MM-dd HH:mm:ss');

	const errorContent = error instanceof Error ? error.stack : String(error);
	const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${errorContent}`;

	if (type === 'error') {
		console.error(logMessage);
	}

	if (type === 'warn' || type === 'info' || type === 'debug') {
		console.log(logMessage);
	}
};

export const logToConsole = (message: string) => {
	const timestamp = DateTime.now()
		.setZone(TIME_ZONE)
		.toFormat('yyyy-MM-dd HH:mm:ss');
	const logMessage = `[${timestamp}] ${message}`;
	console.log(logMessage);
};

export const logToConsoleIfDevMode = (message: string, log: any) => {
	if (!IS_DEV_MODE) return;
	const timestamp = DateTime.now()
		.setZone(TIME_ZONE)
		.toFormat('yyyy-MM-dd HH:mm:ss');
	console.log(`[${timestamp}] ${message}`, log);
};
