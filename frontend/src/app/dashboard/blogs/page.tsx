'use client';

import {useState, useEffect} from 'react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {blogService, type Blog} from '@/services/blog';
import {useSession} from '@/hooks/useSession';

export default function BlogsPage() {
	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const {session} = useSession();

	useEffect(() => {
		loadBlogs();
	}, []);

	const loadBlogs = async () => {
		setIsLoading(true);
		setError('');
		try {
			const response = await blogService.getBlogs();

			if (response.success && response.data) {
				setBlogs(response.data);
			}
		} catch (error: any) {
			console.error('Failed to load blogs:', error);
			setError(error.message || 'Failed to load blogs');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-6xl mx-auto px-4 py-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">My Blogs</h1>
				<Link href="/dashboard/blogs/create">
					<Button>Create Blog</Button>
				</Link>
			</div>

			{error && (
				<Card className="mb-6 border-destructive">
					<CardContent className="pt-6">
						<p className="text-sm text-destructive">{error}</p>
					</CardContent>
				</Card>
			)}

			{isLoading ? (
				<div className="text-center py-12">
					<p className="text-muted-foreground">Loading blogs...</p>
				</div>
			) : blogs.length === 0 ? (
				<Card>
					<CardContent className="text-center py-12">
						<p className="text-muted-foreground mb-4">
							You haven&apos;t created any blogs yet.
						</p>
						<Link href="/dashboard/blogs/create">
							<Button>Create Your First Blog</Button>
						</Link>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{blogs.map((blog) => {
						const isOwner = session?.user?.id === blog.userId;
						return (
							<Card
								key={blog.id}
								className="hover:shadow-lg transition-shadow">
								<CardHeader>
									<div className="flex justify-between items-start">
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-2">
												<CardTitle>{blog.title}</CardTitle>
												{!isOwner && (
													<Badge
														variant="secondary"
														className="text-xs">
														Editor
													</Badge>
												)}
												<Badge
													variant={blog.isActive ? 'default' : 'destructive'}
													className="text-xs">
													{blog.isActive ? 'Active' : 'Inactive'}
												</Badge>
											</div>
											<a
												href={`https://${blog.domain}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-sm text-primary hover:underline">
												{blog.domain}
											</a>
										</div>
										{isOwner && (
											<Link href={`/dashboard/blogs/edit/${blog.id}`}>
												<Button
													variant="outline"
													size="sm">
													Edit
												</Button>
											</Link>
										)}
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<p className="text-sm line-clamp-3">{blog.description}</p>
									</div>

									{isOwner && (
										<div className="grid gap-3 pt-3 border-t">
											<div>
												<p className="text-xs font-medium text-muted-foreground">
													Blog API Key
												</p>
												<p className="text-xs truncate">{blog.apiKey}</p>
											</div>
											<div>
												<p className="text-xs font-medium text-muted-foreground">
													Netlify Site
												</p>
												<p className="text-xs truncate">{blog.netlifySiteId}</p>
											</div>
											<div>
												<p className="text-xs font-medium text-muted-foreground">
													Netlify Token
												</p>
												<p className="text-xs truncate">
													{blog.netlifyToken ? '••••••••••••' : 'Not set'}
												</p>
											</div>
											<div>
												<p className="text-xs font-medium text-muted-foreground">
													R2 Account ID
												</p>
												<p className="text-xs truncate">
													{blog.R2AccountId || 'Not set'}
												</p>
											</div>
											<div>
												<p className="text-xs font-medium text-muted-foreground">
													R2 Access Key ID
												</p>
												<p className="text-xs truncate">
													{blog.R2AccessKeyId || 'Not set'}
												</p>
											</div>
											<div>
												<p className="text-xs font-medium text-muted-foreground">
													R2 Secret Access Key
												</p>
												<p className="text-xs truncate">
													{blog.R2SecretAccessKey ? '••••••••••••' : 'Not set'}
												</p>
											</div>
											<div>
												<p className="text-xs font-medium text-muted-foreground">
													R2 Bucket Name
												</p>
												<p className="text-xs truncate">{blog.R2BucketName}</p>
											</div>
											<div>
												<p className="text-xs font-medium text-muted-foreground">
													R2 Custom Domain
												</p>
												<p className="text-xs truncate">
													{blog.R2CustomDomain}
												</p>
											</div>
											<div>
												<p className="text-xs font-medium text-muted-foreground">
													OpenAI API Key
												</p>
												<p className="text-xs truncate">
													{blog.openAIApiKey ? '••••••••••••' : 'Not set'}
												</p>
											</div>
										</div>
									)}

									<div className="flex justify-between text-xs text-muted-foreground pt-3 border-t">
										<span>
											Created {new Date(blog.createdAt).toLocaleDateString()}
										</span>
										<span>
											Updated {new Date(blog.updatedAt).toLocaleDateString()}
										</span>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
