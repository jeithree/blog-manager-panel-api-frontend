import path from 'node:path';
import {promises as fs} from 'node:fs';
import {DateTime} from 'luxon';
import {DEV_MODE, TIME_ZONE} from '../configs/basics.ts';

const __dirname = import.meta.dirname;

type LogType = 'error' | 'warn' | 'info' | 'debug';

export const logToFile = async (error: unknown, type: LogType) => {
	const relativeFilePath = `../../logs/${type}.txt`;
	const logFilePath = path.join(__dirname, relativeFilePath);
	const timestamp = DateTime.now().setZone(TIME_ZONE).toFormat('yyyy-MM-dd HH:mm:ss');

	const errorContent = error instanceof Error ? error.stack : String(error);

	const logMessage = `[${timestamp}] ${errorContent}\n`;
	await fs.appendFile(logFilePath, logMessage);
	if (DEV_MODE) {
		console.error(logMessage);
	}
};

export const logToConsole = (message: string) => {
	const timestamp = DateTime.now().setZone(TIME_ZONE).toFormat('yyyy-MM-dd HH:mm:ss');
	const logMessage = `[${timestamp}] ${message}`;
	console.log(logMessage);
};

export const logToConsoleIfDevMode = (message: string, log: any) => {
	if (!DEV_MODE) return;
	const timestamp = DateTime.now().setZone(TIME_ZONE).toFormat('yyyy-MM-dd HH:mm:ss');
	console.log(`[${timestamp}] ${message}`, log);
};
