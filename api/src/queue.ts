import {Queue} from 'bullmq';
// import {QueueEvents} from 'bullmq';
import * as Logger from './helpers/logger.ts';
import {
	REDIS_HOST,
	REDIS_PORT,
	POSTS_CREATION_QUEUE_NAME,
} from './configs/basics.ts';

let postsCreationQueue: Queue;

export const initPostsCreationQueue = async () => {
	try {
		const queue = new Queue(POSTS_CREATION_QUEUE_NAME, {
			connection: {
				host: REDIS_HOST,
				port: REDIS_PORT,
			},
		});

		await queue.waitUntilReady();
		postsCreationQueue = queue;

		Logger.logToConsole(`Queue "${POSTS_CREATION_QUEUE_NAME}" is ready.`);
	} catch (error) {
		throw new Error(
			`Failed to initialize queue "${POSTS_CREATION_QUEUE_NAME}": ${error}`
		);
	}
};

export const getPostsCreationQueue = () => {
	if (!postsCreationQueue) {
		throw new Error(`${POSTS_CREATION_QUEUE_NAME} queue is not initialized.`);
	}
	return postsCreationQueue;
};

// const queueEvents = new QueueEvents(POSTS_CREATION_QUEUE_NAME);

// queueEvents.on('completed', ({jobId}) => {
// 	Logger.logToConsole(`Job completed with ID: ${jobId}`);
// });
