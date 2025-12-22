import {defineConfig} from 'vitest/config';
import {loadEnv} from 'vite';

export default defineConfig({
	test: {
		environment: 'node', // integration tests usually use Node
		setupFiles: ['./tests/setup.ts'], // optional
		env: loadEnv('test', process.cwd(), ''), // load all env files including .env.local
		fileParallelism: false, // run test files sequentially (important for integration tests)
	},
});
