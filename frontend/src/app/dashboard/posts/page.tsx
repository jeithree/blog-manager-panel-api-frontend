'use client';

import {useState, useEffect, useCallback, useMemo} from 'react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {postService, type Post, PostStatus} from '@/services/post';
import {categoryService, type Category} from '@/services/category';
import {tagService, type Tag} from '@/services/tag';
import {blogService, type Blog} from '@/services/blog';
import {useSession} from '@/hooks/useSession';
import {useSelectedBlog} from '@/hooks/useSelectedBlog';
import {blogMemberService} from '@/services/blogMember';

export default function PostsPage() {
	const {session} = useSession();
	const [posts, setPosts] = useState<Post[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [tags, setTags] = useState<Tag[]>([]);
	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isEditor, setIsEditor] = useState(false);

	const {selectedBlogId: blogId, setSelectedBlogId: setBlogId} =
		useSelectedBlog();
	const ALL_VALUE = 'all';
	const [selectedCategoryId, setSelectedCategoryId] =
		useState<string>(ALL_VALUE);
	const [selectedTagId, setSelectedTagId] = useState<string>(ALL_VALUE);
	const [selectedStatus, setSelectedStatus] = useState<string>(ALL_VALUE);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	// Check if current user is the owner of the selected blog
	const isOwner = useMemo(() => {
		const currentBlog = blogs.find((b) => b.id === blogId);
		return currentBlog ? currentBlog.userId === session?.user?.id : false;
	}, [blogs, blogId, session?.user?.id]);

	const userId = session?.user?.id;

	const loadBlogs = useCallback(async () => {
		try {
			const response = await blogService.getBlogs();
			if (response.success && response.data) {
				setBlogs(response.data);
			}
		} catch (error) {
			console.error('Failed to load blogs:', error);
		}
	}, []);

	const loadPosts = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await postService.getPosts({
				blogId,
				categoryId:
					selectedCategoryId === ALL_VALUE ? undefined : selectedCategoryId,
				tagId: selectedTagId === ALL_VALUE ? undefined : selectedTagId,
				status:
					selectedStatus === ALL_VALUE
						? undefined
						: (selectedStatus as PostStatus),
				page,
				pageSize: 10,
			});

			if (response.success && response.data) {
				setPosts(response.data.posts);
				setTotalPages(response.data.totalPages);
			}
		} catch (error) {
			console.error('Failed to load posts:', error);
		} finally {
			setIsLoading(false);
		}
	}, [
		ALL_VALUE,
		blogId,
		page,
		selectedCategoryId,
		selectedStatus,
		selectedTagId,
	]);

	const loadFilters = useCallback(async () => {
		try {
			const [categoriesRes, tagsRes] = await Promise.all([
				categoryService.getCategories({blogId}),
				tagService.getTags({blogId}),
			]);

			if (categoriesRes.success && categoriesRes.data) {
				setCategories(categoriesRes.data);
			}
			if (tagsRes.success && tagsRes.data) {
				setTags(tagsRes.data);
			}
		} catch (error) {
			console.error('Failed to load filters:', error);
		}
	}, [blogId]);

	// Load blogs on mount
	useEffect(() => {
		loadBlogs();
	}, [loadBlogs]);

	// Validate and set default blogId after blogs are loaded
	useEffect(() => {
		if (blogs.length > 0) {
			const blogExists = blogId ? blogs.some((b) => b.id === blogId) : false;
			if (!blogExists) {
				setBlogId(blogs[0].id);
			}
		}
	}, [blogs, blogId, setBlogId]);

	// Load posts and filters when dependencies change
	useEffect(() => {
		if (blogId) {
			loadPosts();
			loadFilters();
		}

		// determine if current user is an editor for the selected blog
		const determineEditor = async () => {
			if (!blogId || !userId) return setIsEditor(false);
			try {
				const membersRes = await blogMemberService.listMembers(blogId);
				if (membersRes.success && membersRes.data) {
					const me = userId;
					const member = membersRes.data.find((m) => m.user.id === me);
					setIsEditor(Boolean(member && member.role === 'EDITOR'));
				} else {
					setIsEditor(false);
				}
			} catch (err) {
				console.error('Failed to determine membership role', err);
				setIsEditor(false);
			}
		};

		determineEditor();
	}, [blogId, loadFilters, loadPosts, userId]);

	const getStatusBadgeVariant = (status: PostStatus) => {
		switch (status) {
			case PostStatus.PUBLISHED:
				return 'default';
			case PostStatus.SCHEDULED:
				return 'secondary';
			case PostStatus.DRAFT:
				return 'outline';
			default:
				return 'outline';
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	return (
		<div className="max-w-7xl mx-auto px-4 py-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">Posts</h1>
				{!isEditor ? (
					<Link href="/dashboard/posts/create">
						<Button>Create Post</Button>
					</Link>
				) : null}
			</div>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Filters</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div>
							<label className="text-sm font-medium mb-2 block">Blog</label>
							<Select
								value={blogId}
								onValueChange={(val) => {
									setBlogId(val);
									setPage(1);
								}}>
								<SelectTrigger>
									<SelectValue placeholder="Select a blog" />
								</SelectTrigger>
								<SelectContent>
									{blogs.map((blog) => (
										<SelectItem
											key={blog.id}
											value={blog.id}>
											{blog.title}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<div className="flex items-center justify-between mb-2">
								<label className="text-sm font-medium">Category</label>
								{selectedCategoryId !== ALL_VALUE && (
									<button
										onClick={() => {
											setSelectedCategoryId(ALL_VALUE);
											setPage(1);
										}}
										className="text-xs text-muted-foreground hover:text-foreground">
										Clear
									</button>
								)}
							</div>
							<Select
								value={selectedCategoryId}
								onValueChange={(val) => {
									setSelectedCategoryId(val);
									setPage(1);
								}}>
								<SelectTrigger>
									<SelectValue placeholder="All categories" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={ALL_VALUE}>All categories</SelectItem>
									{categories.map((cat) => (
										<SelectItem
											key={cat.id}
											value={cat.id}>
											{cat.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<div className="flex items-center justify-between mb-2">
								<label className="text-sm font-medium">Tag</label>
								{selectedTagId !== ALL_VALUE && (
									<button
										onClick={() => {
											setSelectedTagId(ALL_VALUE);
											setPage(1);
										}}
										className="text-xs text-muted-foreground hover:text-foreground">
										Clear
									</button>
								)}
							</div>
							<Select
								value={selectedTagId}
								onValueChange={(val) => {
									setSelectedTagId(val);
									setPage(1);
								}}>
								<SelectTrigger>
									<SelectValue placeholder="All tags" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={ALL_VALUE}>All tags</SelectItem>
									{tags.map((tag) => (
										<SelectItem
											key={tag.id}
											value={tag.id}>
											{tag.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<div className="flex items-center justify-between mb-2">
								<label className="text-sm font-medium">Status</label>
								{selectedStatus !== ALL_VALUE && (
									<button
										onClick={() => {
											setSelectedStatus(ALL_VALUE);
											setPage(1);
										}}
										className="text-xs text-muted-foreground hover:text-foreground">
										Clear
									</button>
								)}
							</div>
							<Select
								value={selectedStatus}
								onValueChange={(val) => {
									setSelectedStatus(val);
									setPage(1);
								}}>
								<SelectTrigger>
									<SelectValue placeholder="All statuses" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={ALL_VALUE}>All statuses</SelectItem>
									<SelectItem value={PostStatus.DRAFT}>Draft</SelectItem>
									<SelectItem value={PostStatus.SCHEDULED}>
										Scheduled
									</SelectItem>
									<SelectItem value={PostStatus.PUBLISHED}>
										Published
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{isLoading ? (
				<div className="text-center py-8">Loading posts...</div>
			) : posts.length === 0 ? (
				<Card>
					<CardContent className="py-8 text-center">
						<p className="text-muted-foreground mb-4">No posts found</p>
					</CardContent>
				</Card>
			) : (
				<>
					<div className="space-y-4">
						{posts.map((post) => (
							<Card key={post.id}>
								<CardContent className="p-6">
									<div className="flex justify-between items-start">
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-2">
												<h3 className="text-xl font-semibold">{post.title}</h3>
												{post.AIPostReviewIssues && (
													<Badge
														variant="outline"
														className="bg-yellow-50 text-yellow-700 border-yellow-300">
														has suggestions
													</Badge>
												)}
												<Badge variant={getStatusBadgeVariant(post.status)}>
													{post.status}
												</Badge>
											</div>

											{post.description && (
												<p className="text-muted-foreground mb-3">
													{post.description}
												</p>
											)}

											<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
												{post.category && (
													<span>Category: {post.category.name}</span>
												)}
												{post.author && <span>Author: {post.author.name}</span>}
												<span>Created: {formatDate(post.createdAt)}</span>
												{post.publishedAt && (
													<span>Published: {formatDate(post.publishedAt)}</span>
												)}
											</div>

											{post.tags && post.tags.length > 0 && (
												<div className="flex flex-wrap gap-2 mt-3">
													{post.tags.map((tag) => (
														<Badge
															key={tag.id}
															variant="outline">
															{tag.name}
														</Badge>
													))}
												</div>
											)}
										</div>

										<div className="flex gap-2 ml-4">
											{(post.status !== PostStatus.PUBLISHED || isOwner) && (
												<Link
													href={`/dashboard/posts/edit/${post.id}?blogId=${blogId}`}>
													<Button
														variant="outline"
														size="sm">
														Edit
													</Button>
												</Link>
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{totalPages > 1 && (
						<div className="flex justify-center gap-2 mt-6">
							<Button
								variant="outline"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}>
								Previous
							</Button>
							<span className="flex items-center px-4">
								Page {page} of {totalPages}
							</span>
							<Button
								variant="outline"
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								disabled={page === totalPages}>
								Next
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
