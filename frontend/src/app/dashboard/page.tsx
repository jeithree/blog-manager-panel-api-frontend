'use client';

import Link from 'next/link';
import {useSession} from '@/hooks/useSession';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';

export default function DashboardPage() {
	const {session} = useSession();
	const isAdmin = session?.user?.role === 'ADMIN';

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<h1 className="text-3xl font-bold mb-4">Welcome to your Dashboard</h1>
			<p className="text-muted-foreground mb-8">
				You&apos;re logged in as {session?.user?.username}
			</p>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
				<Card>
					<CardHeader>
						<CardTitle>User Info</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
                        <p>
							<span className="font-medium">ID:</span>{' '}
							{session?.user?.id}
						</p>
						<p>
							<span className="font-medium">Username:</span>{' '}
							{session?.user?.username}
						</p>
						<p>
							<span className="font-medium">Email:</span> {session?.user?.email}
						</p>
						<p>
							<span className="font-medium">Role:</span> {session?.user?.role}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<Link href="/dashboard/profile">
							<Button
								className="w-full mb-2"
								variant="outline">
								Profile Settings
							</Button>
						</Link>
						<Link href="/dashboard/blogs/create">
							<Button
								className="w-full mb-2"
								variant="outline">
								Create New Blog
							</Button>
						</Link>
						<Link href="/dashboard/authors">
							<Button
								className="w-full mb-2"
								variant="outline">
								Manage Authors
							</Button>
						</Link>
						<Link href="/dashboard/posts/create">
							<Button
								className="w-full mb-2"
								variant="outline">
								Create New Post
							</Button>
						</Link>
						{isAdmin && (
							<Link href="/dashboard/admin/create-user">
								<Button
									className="w-full"
									variant="outline">
									Admin: Create User
								</Button>
							</Link>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Manage Content</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<Link href="/dashboard/posts">
							<Button
								className="w-full mb-2"
								variant="outline">
								View All Posts
							</Button>
						</Link>
						<Link href="/dashboard/categories-tags">
							<Button
								className="w-full"
								variant="outline">
								Manage Categories & Tags
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
