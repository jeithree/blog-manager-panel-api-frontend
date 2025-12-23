import schedule from 'node-schedule';
import {PostStatus} from '@prisma/client';
import prisma from '../prisma.ts';
import * as netlifyService from './netlifyService.ts';
import * as Logger from '../helpers/logger.ts';
import {sleep} from '../helpers/helpers.ts';
import RedisCache from '../lib/redisCache.ts';
import {DEV_MODE} from '../configs/basics.ts';
import * as postService from './postService.ts';

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

	if (!DEV_MODE) {
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
			'DEV_MODE is enabled; skipping Netlify deploys after publishing scheduled posts.'
		);

		for (const postId of postIds) {
			try {
				await postService.toMarkdownContent(postId);
				Logger.logToConsole(
					`Markdown export succeeded for published post ${postId} in DEV_MODE`
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
	schedule.scheduleJob({rule: '*/1 * * * *'}, async () => {
		try {
			await publishScheduledPosts();
		} catch (error) {
			Logger.logToConsole(`Cron publish job failed: ${String(error)}`);
			await Logger.logToFile(error, 'error');
		}
	});

	Logger.logToConsole('Cron jobs started: publish scheduler every minute');
};
