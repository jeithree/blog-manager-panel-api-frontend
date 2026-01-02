'use client';

import React, {useState} from 'react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {logout} from '@/services/auth';
import {useSession} from '@/hooks/useSession';

interface NavItem {
	title: string;
	href: string;
}

const baseNavItems: NavItem[] = [
	{title: 'Overview', href: '/dashboard'},
	{title: 'Posts', href: '/dashboard/posts'},
	{title: 'Blogs', href: '/dashboard/blogs'},
	{title: 'Categories & Tags', href: '/dashboard/categories-tags'},
	{title: 'Authors', href: '/dashboard/authors'},
    {title: 'Prompts', href: '/dashboard/prompts'},
];

export function DashboardNav() {
	const pathname = usePathname();
	const router = useRouter();
	const {session, mutate} = useSession();
	const isAdmin = session?.user?.role === 'ADMIN';
	const navItems = isAdmin
		? [
				...baseNavItems,
				{title: 'Admin', href: '/dashboard/admin/create-user'},
		  ]
		: baseNavItems;
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const handleLogout = async () => {
		try {
			setIsLoggingOut(true);
			await logout();
			await mutate(undefined, false);
			router.push('/login');
		} catch (error) {
			console.error('Logout failed:', error);
			setIsLoggingOut(false);
		}
	};

	return (
		<nav className="border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/70 shadow-sm">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					<div className="flex items-center gap-8">
						<Link
							href="/dashboard"
							className="text-xl font-bold tracking-tight">
							Blog Manager
						</Link>

						<div className="hidden md:flex gap-1">
							{navItems.map((item) => {
								const isActive = pathname === item.href;
								return (
									<Link
										key={item.href}
										href={item.href}
										className={cn(
											'px-3 py-2 text-sm font-medium rounded-md transition-colors',
											isActive
												? 'bg-primary text-primary-foreground shadow-sm'
												: 'text-muted-foreground hover:bg-muted hover:text-foreground'
										)}>
										{item.title}
									</Link>
								);
							})}
						</div>
					</div>

					<div>
						<Button
							variant="outline"
							size="sm"
							onClick={handleLogout}
							disabled={isLoggingOut}>
							{isLoggingOut ? 'Logging out...' : 'Logout'}
						</Button>
					</div>
				</div>

				{/* Mobile navigation */}
				<div className="flex md:hidden pb-3 gap-1 overflow-x-auto">
					{navItems.map((item) => {
						const isActive = pathname === item.href;
						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									'px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
									isActive
										? 'bg-primary text-primary-foreground shadow-sm'
										: 'text-muted-foreground hover:bg-muted hover:text-foreground'
								)}>
								{item.title}
							</Link>
						);
					})}
				</div>
			</div>
		</nav>
	);
}
