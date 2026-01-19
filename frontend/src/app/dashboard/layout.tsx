'use client';

import {useRouter} from 'next/navigation';
import {useEffect} from 'react';
import {useSession} from '@/hooks/useSession';
import {DashboardNav} from '@/components/DashboardNav';

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const {session, isLoading} = useSession();

	useEffect(() => {
		if (!isLoading && !session?.isAuthenticated) {
			router.push('/login');
		}
	}, [isLoading, session, router]);

	if (isLoading || !session?.isAuthenticated) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p>Loading...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-linear-to-b from-background via-muted/30 to-background">
			<DashboardNav />
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-35 md:pt-25">
				{children}
			</main>
		</div>
	);
}
