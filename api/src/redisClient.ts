import {createClient} from 'redis';
import {REDIS_URL} from './configs/basics.ts';
import * as Logger from './helpers/logger.ts';

const redisClient = createClient({
	url: REDIS_URL,
	password: undefined,
});

redisClient.on('error', (err) => Logger.logToConsole(`Redis Client Error: ${err}`));
redisClient.on('connect', () => Logger.logToConsole('Redis: connecting...'));
redisClient.on('ready', () => Logger.logToConsole('Redis: ready'));

await redisClient.connect();
export default redisClient;
