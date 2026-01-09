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

				// generate the image prompt with 3 attemps
				let imagePrompt = '';
				let imageAttempts = 0;
				let imageMaxAttempts = 3;

				while (imageAttempts < imageMaxAttempts) {
					try {
						imagePrompt = await creatorService.generateImagePrompt(
							post.content,
							blogId
						);
						break; // exit loop if successful
					} catch (error) {
						imageAttempts++;
						await Logger.logToFile(
							`Error generating image prompt for blog ${blogId} (attempt ${imageAttempts}): ${String(
								error
							)}`,
							'warn'
						);
						if (imageAttempts >= imageMaxAttempts) {
							break; // proceed without image prompt
						}
						await sleep(5000); // wait before retrying
						continue;
					}
				}

				const postData = {
					...post,
					tagIds,
					AIGeneratedImagePrompt: imagePrompt,
					status: 'DRAFT' as const,
				};

				let savingAttempts = 0;
				const sabingMaxAttempts = 3;
				while (savingAttempts < sabingMaxAttempts) {
					try {
						await postService.createPost(userId, postData, undefined);
						break;
					} catch (error) {
						savingAttempts++;
						if (savingAttempts >= sabingMaxAttempts) {
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
		concurrency: 2,
	}
);

worker.on('completed', (job) => {
	Logger.logToConsole(`Job completed successfully, jobId: ${job.id}`);
});

worker.on('failed', (job, err) => {
	Logger.logToConsole(`Job failed, jobId: ${job?.id}, error: ${err.message}`);
});

Logger.logToConsole(`Worker for queue "${POSTS_CREATION_QUEUE_NAME}" started.`);
