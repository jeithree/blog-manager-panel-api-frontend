import app from './app.ts';
import * as Logger from './helpers/logger.ts';
import {startCronJobs} from './services/cronService.ts';

app.listen(app.get('port'), () => {
	Logger.logToConsole(`Server running on http://localhost:${app.get('port')}`);
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
