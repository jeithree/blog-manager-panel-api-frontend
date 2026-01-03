import {Worker, Job} from 'bullmq';
import * as postService from './services/postService.ts';
import * as creatorService from './services/creatorService.ts';
import {
	POSTS_CREATION_QUEUE_NAME,
	PROCESS_POST_CREATION_JOB_NAME,
	REDIS_HOST,
	REDIS_PORT,
} from './configs/basics.ts';
import {sleep} from './helpers/helpers.ts';
import * as Logger from './helpers/logger.ts';
import prisma from './prisma.ts';

const worker = new Worker(
	POSTS_CREATION_QUEUE_NAME,
	async (job: Job) => {
		if (job.name === PROCESS_POST_CREATION_JOB_NAME) {
			const {userId, blogId, categoryId, title, slug} = job.data;

			let post;
			let attempts = 0;
			const maxAttempts = 3;

			while (attempts < maxAttempts) {
				try {
					post = await creatorService.generatePostContent(userId, {
						blogId,
						categoryId,
						title,
						slug,
					});
					break; // exit loop if successful
				} catch (error) {
					attempts++;
					await Logger.logToFile(
						`Error generating post content for blog ${blogId} (attempt ${attempts}): ${String(
							error
						)}`,
						'warn'
					);
					if (attempts >= maxAttempts) {
						throw error;
					}
					await sleep(5000); // wait before retrying
					continue;
				}
			}

			if (post) {
				// map generated tag names to tag IDs in the blog
				let tagIds: string[] = [];
				try {
					const tagNames: string[] = (post as any).tagNames || [];
					if (tagNames.length) {
						const existing = await prisma.tag.findMany({
							where: {name: {in: tagNames}, blogId},
							select: {id: true, name: true},
						});
						const nameToId = new Map(existing.map((t) => [t.name, t.id]));

						for (const name of tagNames) {
							const existingId = nameToId.get(name);
							if (existingId) tagIds.push(existingId);
							// if tag does not exist, skip it (do not create)
						}
					}
				} catch (err) {
					await Logger.logToFile(err, 'warn');
					Logger.logToConsole(
						`Failed mapping tags for blog ${blogId}: ${String(err)}`
					);
				}

				const postData = {
					...post,
					tagIds,
					status: 'DRAFT' as const,
				};

				let attempts = 0;
				const maxAttempts = 3;
				while (attempts < maxAttempts) {
					try {
						await postService.createPost(userId, postData, undefined);
						break;
					} catch (error) {
						attempts++;
						if (attempts >= maxAttempts) {
							throw error;
						}
						await sleep(5000); // wait before retrying
						continue;
					}
				}
			}
		}
	},
	{
		connection: {
			host: REDIS_HOST,
			port: REDIS_PORT,
		},
		concurrency: 3,
	}
);

worker.on('completed', (job) => {
	Logger.logToConsole(`Job completed successfully, jobId: ${job.id}`);
});

worker.on('failed', (job, err) => {
	Logger.logToConsole(`Job failed, jobId: ${job?.id}, error: ${err.message}`);
});

Logger.logToConsole(`Worker for queue "${POSTS_CREATION_QUEUE_NAME}" started.`);
