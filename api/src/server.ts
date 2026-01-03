import app from './app.ts';
import * as Logger from './helpers/logger.ts';
import {
	addJobsToPostsCreationQueue,
	startCronJobs,
} from './services/cronService.ts';
import {initPostsCreationQueue} from './queue.ts';

await initPostsCreationQueue();

app.listen(app.get('port'), async () => {
	Logger.logToConsole(`Server running on http://localhost:${app.get('port')}`);
	await addJobsToPostsCreationQueue();
	startCronJobs();
});

const gracefulShutdown = async () => {
	try {
		console.log('Shutting down gracefully...');
		process.exit(0);
	} catch (error) {
		console.error('Error during shutdown:', error);
		process.exit(1);
	}
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
