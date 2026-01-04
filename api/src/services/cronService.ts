import schedule from 'node-schedule';
import {PostStatus} from '@prisma/client';
import prisma from '../prisma.ts';
import * as netlifyService from './netlifyService.ts';
import * as Logger from '../helpers/logger.ts';
import {sleep} from '../helpers/helpers.ts';
import RedisCache from '../lib/redisCache.ts';
import {
	IS_DEV_MODE,
	PROCESS_POST_CREATION_JOB_NAME,
} from '../configs/basics.ts';
import * as postService from './postService.ts';
import * as creatorService from './creatorService.ts';
import {getPostsCreationQueue} from '../queue.ts';

const triggerDeployWithRetry = async (
	netlifySiteId: string,
	maxAttempts = 3,
	backoffMs = 10_000
) => {
	let attempt = 1;
	while (attempt <= maxAttempts) {
		try {
			const deploy = await netlifyService.triggerRebuild(netlifySiteId);
			await netlifyService.waitForDeploy(deploy.id);
			Logger.logToConsole(
				`Netlify deploy succeeded (site: ${netlifySiteId}, deploy: ${deploy.id})`
			);
			return;
		} catch (error) {
			Logger.logToConsole(
				`Netlify deploy attempt ${attempt} failed for site ${netlifySiteId}: ${String(
					error
				)}`
			);
			if (attempt === maxAttempts) throw error;
			await sleep(backoffMs);
			attempt += 1;
		}
	}
};

const publishScheduledPosts = async () => {
	const now = new Date();

	const scheduledPosts = await prisma.post.findMany({
		where: {
			status: PostStatus.SCHEDULED,
			publishedAt: {lte: now},
		},
		include: {
			blog: {select: {netlifySiteId: true}},
		},
	});

	if (!scheduledPosts.length) return;

	const postIds = scheduledPosts.map((post) => post.id);
	const blogIds = Array.from(
		new Set(scheduledPosts.map((post) => post.blogId))
	);

	await prisma.post.updateMany({
		where: {id: {in: postIds}},
		data: {status: PostStatus.PUBLISHED},
	});

	for (const blogId of blogIds) {
		await RedisCache.deleteByPattern(`public:posts:${blogId}:*`);
		await RedisCache.deleteByPattern(`public:post:${blogId}:*`);
	}

	Logger.logToConsole(
		`Published ${
			scheduledPosts.length
		} scheduled post(s) at ${now.toISOString()}`
	);

	if (!IS_DEV_MODE) {
		const uniqueSiteIds = Array.from(
			new Set(
				scheduledPosts
					.map((post) => post.blog?.netlifySiteId)
					.filter((id): id is string => Boolean(id))
			)
		);

		for (const siteId of uniqueSiteIds) {
			try {
				await triggerDeployWithRetry(siteId);
			} catch (error) {
				Logger.logToConsole(
					`Failed to deploy site ${siteId} after retries: ${String(error)}`
				);
				await Logger.logToFile(error, 'error');
			}
		}
	} else {
		Logger.logToConsole(
			'IS_DEV_MODE is enabled; skipping Netlify deploys after publishing scheduled posts.'
		);

		for (const postId of postIds) {
			try {
				await postService.toMarkdownContent(postId);
				Logger.logToConsole(
					`Markdown export succeeded for published post ${postId} in IS_DEV_MODE`
				);
			} catch (error) {
				Logger.logToConsole(
					`Failed to generate static page for post ${postId}: ${String(error)}`
				);
				await Logger.logToFile(error, 'error');
			}
		}
	}
};

export const startCronJobs = () => {
	schedule.scheduleJob('*/1 * * * *', async () => {
		try {
			await publishScheduledPosts();
		} catch (error) {
			Logger.logToConsole(`Cron publish job failed: ${String(error)}`);
			await Logger.logToFile(error, 'error');
		}
	});

	Logger.logToConsole('Cron jobs started: publish scheduler every minute');
};

export const addJobsToPostsCreationQueue = async () => {
	// run every day at 8 AM, but only enqueue for blogs whose last post is >= 5 days old
	schedule.scheduleJob('0 8 * * *', async () => {
		const queue = getPostsCreationQueue();

		const blogs = await prisma.blog.findMany({});
		const now = new Date();

		for (const blog of blogs) {
			try {
				// get the most recent post for this blog
				const lastPost = await prisma.post.findFirst({
					where: {blogId: blog.id},
					orderBy: {createdAt: 'desc'},
					select: {createdAt: true},
				});

				const daysSinceLast = lastPost
					? Math.floor(
							(now.getTime() - new Date(lastPost.createdAt).getTime()) /
								(1000 * 60 * 60 * 24)
					  )
					: Infinity; // if no posts exist, always enqueue

				if (daysSinceLast < 5) {
					// skip this blog; not old enough yet
					continue;
				}

				// first generate title suggestions for the blog
				let titleSuggestionsGroupedByCategories;
				let attempts = 0;
				const maxAttempts = 3;

				while (attempts < maxAttempts) {
					try {
						titleSuggestionsGroupedByCategories =
							await creatorService.generateTitleSuggestions(
								blog.userId,
								blog.id
							);
						break; // exit loop if successful
					} catch (error) {
						attempts++;
						await Logger.logToFile(
							`Error generating title suggestions for blog ${
								blog.id
							} (attempt ${attempts}): ${String(error)}`,
							'warn'
						);
						if (attempts >= maxAttempts) break;
						await sleep(5000); // wait before retrying
						continue;
					}
				}

				if (
					titleSuggestionsGroupedByCategories &&
					titleSuggestionsGroupedByCategories.length > 0
				) {
					for (const titleSuggestionsGroupedByCategory of titleSuggestionsGroupedByCategories) {
						const randomSuggestion =
							titleSuggestionsGroupedByCategory.titles[
								Math.floor(
									Math.random() *
										titleSuggestionsGroupedByCategory.titles.length
								)
							];
						await queue.add(
							PROCESS_POST_CREATION_JOB_NAME,
							{
								userId: blog.userId,
								blogId: blog.id,
								categoryId: titleSuggestionsGroupedByCategory.categoryId,
								title: randomSuggestion.title,
								slug: randomSuggestion.slug,
							},
							{removeOnComplete: true, attempts: 3}
						);
					}

					Logger.logToConsole(
						`Added post creation jobs for blog ${blog.title} to the queue.`
					);
				}
			} catch (err) {
				await Logger.logToFile(err, 'error');
				Logger.logToConsole(
					`Failed processing post-creation for blog ${blog.id}: ${String(err)}`
				);
			}
		}

		Logger.logToConsole('Daily enqueue check completed for all blogs.');
	});

	Logger.logToConsole(
		'Cron job started: daily enqueue check at 8 AM (enqueues only when last post >= 5 days)'
	);
};
