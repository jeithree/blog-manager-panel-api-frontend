'use client';

import useSWR from 'swr';
import {getSession} from '@/services/auth';
import type {SessionResponse} from '@/types/session';

export function useSession() {
	const {data, error, isLoading, mutate} = useSWR<SessionResponse>(
		'/api/v1/auth/session',
		async () => {
			const response = await getSession();
			return response.data!;
		},
		{
			revalidateOnFocus: false,
			shouldRetryOnError: false,
		}
	);

	return {
		session: data,
		isLoading,
		isError: error,
		mutate,
	};
}
