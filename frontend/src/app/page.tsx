'use client';

import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {useSession} from '@/hooks/useSession';

export default function HomePage() {
	const {session} = useSession();
	if (session?.isAuthenticated) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center p-8">
				<div className="max-w-2xl text-center space-y-6">
					<h1 className="text-4xl font-bold">
						Welcome Back, {session.user?.username}!
					</h1>
					<div className="flex gap-4 justify-center">
						<Link href="/dashboard">
							<Button>Go to Dashboard</Button>
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-8">
			<div className="max-w-2xl text-center space-y-6">
				<h1 className="text-4xl font-bold">Welcome to Home</h1>
				<div className="flex gap-4 justify-center">
					<Link href="/login">
						<Button>Login</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
