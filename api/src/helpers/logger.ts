import {DateTime} from 'luxon';
import {TIME_ZONE} from '../configs/basics.ts';

type LogType = 'error' | 'warn' | 'info' | 'debug';

export const log = async (log: unknown, type: LogType) => {
	const timestamp = DateTime.now()
		.setZone(TIME_ZONE)
		.toFormat('yyyy-MM-dd HH:mm:ss');

	const logContent = log instanceof Error ? log.stack : String(log);
	const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${logContent}`;

	if (type === 'error') {
		console.error(logMessage);
	}

	if (type === 'warn' || type === 'info' || type === 'debug') {
		console.log(logMessage);
	}
};
