import {createInitialAdminUser} from './services/adminService.ts';
import {initPostsCreationQueue} from './queue.ts';

export const init = async () => {
	await createInitialAdminUser();
	await initPostsCreationQueue();
};
