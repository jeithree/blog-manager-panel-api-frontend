import redisClient from '../redisClient.ts';
import * as Logger from '../helpers/logger.ts';

class RedisCache {
	static #defaultTTL = 3600; // 1 hour in seconds

	/**
	 * Sets a value in the cache with an optional TTL
	 * @param key - The cache key
	 * @param data - The data to cache
	 * @param ttl - The time to live in seconds
	 * @returns True if successful, false otherwise
	 */
	static async set(key: string, data: any, ttl: number = this.#defaultTTL) {
		try {
			await redisClient.setEx(`api:${key}`, ttl, JSON.stringify(data));
			return true;
		} catch (error) {
			Logger.logToFile(`Cache set error for key ${key}: ${error}`, 'warn');
			return false;
		}
	}

	/**
	 * Retrieves a value from the cache
	 * @param key - The cache key
	 * @returns The cached data or null if not found
	 */
	static async get(key: string) {
		try {
			const data = await redisClient.get(`api:${key}`);
			return data ? JSON.parse(data) : null;
		} catch (error) {
			Logger.logToFile(`Cache get error for key ${key}: ${error}`, 'warn');
			return null;
		}
	}

	/**
	 * Deletes a value from the cache
	 * @param key - The cache key
	 * @returns True if successful, false otherwise
	 */
	static async delete(key: string) {
		try {
			await redisClient.del(`api:${key}`);
			return true;
		} catch (error) {
			Logger.logToFile(`Cache deletion error for key ${key}: ${error}`, 'warn');
			return false;
		}
	}

	/**
	 * Clears all cached values with the 'api:' prefix
	 * @returns True if successful, false otherwise
	 */
	static async clear() {
		try {
			const keys = await redisClient.keys('api:*');
			if (keys.length > 0) {
				await redisClient.del(keys);
			}
			return true;
		} catch (error) {
			Logger.logToFile(`Cache clear error: ${error}`, 'warn');
			return false;
		}
	}

	/**
	 * Deletes all cache entries matching the provided pattern (without the api: prefix)
	 * @param pattern - Glob-style pattern, e.g. `public:posts:blogId:*`
	 */
	static async deleteByPattern(pattern: string) {
		const match = `api:${pattern}`;
		try {
			const keys: string[] = [];
			for await (const key of redisClient.scanIterator({
				MATCH: match,
				COUNT: 100,
			})) {
				keys.push(String(key));
			}

			if (keys.length > 0) {
				await redisClient.del(keys);
			}
			return true;
		} catch (error) {
			Logger.logToFile(
				`Cache deleteByPattern error for ${pattern}: ${error}`,
				'warn'
			);
			return false;
		}
	}
}

export default RedisCache;
