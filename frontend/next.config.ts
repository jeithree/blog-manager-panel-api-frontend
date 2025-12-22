import type {NextConfig} from 'next';
import {API_URL} from '@/config';

const nextConfig: NextConfig = {
	async rewrites() {
		return [
			{
				source: '/api/:path*',
				destination: `${API_URL}/api/:path*`,
			},
		];
	},
	reactCompiler: true,
};

export default nextConfig;
