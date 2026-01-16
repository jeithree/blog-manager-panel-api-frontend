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
	netlifyToken: string,
	maxAttempts = 3,
	backoffMs = 10_000
) => {
	let attempt = 1;
	while (attempt <= maxAttempts) {
		try {
			const deploy = await netlifyService.triggerRebuild(
				netlifySiteId,
				netlifyToken
			);
			await netlifyService.waitForDeploy(deploy.id, netlifyToken);
			Logger.log(
				`Netlify deploy succeeded (site: ${netlifySiteId}, deploy: ${deploy.id})`,
				'info'
			);
			return;
		} catch (error) {
			Logger.log(
				`Netlify deploy attempt ${attempt} failed for site ${netlifySiteId}: ${String(
					error
				)}`,
				'warn'
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
			blog: {select: {netlifySiteId: true, netlifyToken: true}},
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

	Logger.log(
		`Published ${
			scheduledPosts.length
		} scheduled post(s) at ${now.toISOString()}`,
		'info'
	);

	if (!IS_DEV_MODE) {
		// Create a map of unique site ID -> token pairs
		const uniqueSites = new Map<string, string>();
		for (const post of scheduledPosts) {
			if (post.blog.netlifySiteId && post.blog.netlifyToken) {
				uniqueSites.set(post.blog.netlifySiteId, post.blog.netlifyToken);
			}
		}

		for (const [siteId, token] of uniqueSites) {
			try {
				await triggerDeployWithRetry(siteId, token);
			} catch (error) {
				Logger.log(
					`Failed to deploy site ${siteId} after retries: ${String(error)}`,
					'error'
				);
				await Logger.log(error, 'error');
			}
		}
	} else {
		Logger.log(
			'IS_DEV_MODE is true; skipping Netlify deploys after publishing scheduled posts.',
			'info'
		);

		// this is done for manual publish when running locally and copying manually the markdown to static site (astro)
		for (const postId of postIds) {
			try {
				await postService.toMarkdownContent(postId);
				Logger.log(
					`Markdown export succeeded for published post ${postId} in IS_DEV_MODE`,
					'info'
				);
			} catch (error) {
				Logger.log(
					`Failed to generate static page for post ${postId}: ${String(error)}`,
					'error'
				);
				await Logger.log(error, 'error');
			}
		}
	}
};

export const startCronJobs = () => {
	schedule.scheduleJob('*/1 * * * *', async () => {
		try {
			await publishScheduledPosts();
		} catch (error) {
			Logger.log(`Cron publish job failed: ${String(error)}`, 'error');
			await Logger.log(error, 'error');
		}
	});

	Logger.log('Cron jobs started: publish scheduler every minute', 'info');
};

export const addJobsToPostsCreationQueue = async () => {
	// run every day at 9 AM, but only enqueue for blogs whose last post is >= 5 days old
	schedule.scheduleJob('0 9 * * *', async () => {
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
						await Logger.log(
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

					Logger.log(
						`Added post creation jobs for blog ${blog.title} to the queue.`,
						'info'
					);
				}
			} catch (err) {
				await Logger.log(err, 'error');
				Logger.log(
					`Failed processing post-creation for blog ${blog.id}: ${String(err)}`,
					'error'
				);
			}
		}

		Logger.log('Daily enqueue check completed for all blogs.', 'info');
	});

	Logger.log(
		'Cron job started: daily enqueue check at 9 AM (enqueues only when last post >= 5 days)',
		'info'
	);
};
