'use client';

import {useEffect, useState, useCallback} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {authorService, type Author} from '@/services/author';
import {blogService, type Blog} from '@/services/blog';

export default function AuthorsPage() {
	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [selectedBlogId, setSelectedBlogId] = useState('');
	const [authors, setAuthors] = useState<Author[]>([]);
	const [name, setName] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const loadBlogs = useCallback(async () => {
		try {
			const res = await blogService.getBlogs();
			if (res.success && res.data) {
				setBlogs(res.data);
				if (!selectedBlogId && res.data.length > 0) {
					setSelectedBlogId(res.data[0].id);
				}
			}
		} catch (error) {
			console.error('Failed to load blogs', error);
		}
	}, [selectedBlogId]);

	const loadAuthors = useCallback(async (blogId: string) => {
		try {
			const res = await authorService.getAuthors(blogId);
			if (res.success && res.data) {
				setAuthors(res.data);
			}
		} catch (error) {
			console.error('Failed to load authors', error);
		}
	}, []);

	useEffect(() => {
		loadBlogs();
	}, [loadBlogs]);

	useEffect(() => {
		if (selectedBlogId) {
			loadAuthors(selectedBlogId);
		}
	}, [loadAuthors, selectedBlogId]);

	const handleCreate = async () => {
		if (!name.trim() || !selectedBlogId) return;
		setIsLoading(true);
		try {
			const res = await authorService.createAuthor({
				name: name.trim(),
				blogId: selectedBlogId,
			});
			if (res.success && res.data) {
				setAuthors((prev) => [res.data!, ...prev]);
				setName('');
			}
		} catch (error) {
			console.error('Failed to create author', error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto space-y-6 py-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Authors</h1>
					<p className="text-muted-foreground">
						Create and manage authors per blog.
					</p>
				</div>
			</div>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle>Blog</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<Label>Select blog</Label>
					<Select
						value={selectedBlogId}
						onValueChange={setSelectedBlogId}>
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
				</CardContent>
			</Card>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle>Create Author</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="authorName">Name</Label>
						<Input
							id="authorName"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Jane Doe"
						/>
					</div>
					<Button
						onClick={handleCreate}
						disabled={isLoading || !name.trim() || !selectedBlogId}>
						{isLoading ? 'Saving...' : 'Create Author'}
					</Button>
				</CardContent>
			</Card>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle>Existing Authors</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					{authors.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No authors yet for this blog.
						</p>
					) : (
						<div className="space-y-2">
							{authors.map((author) => (
								<div
									key={author.id}
									className="flex items-center justify-between rounded border px-3 py-2">
									<div>
										<p className="font-medium">{author.name}</p>
										<p className="text-xs text-muted-foreground">
											Created {new Date(author.createdAt).toLocaleDateString()}
										</p>
									</div>
									<span className="text-xs text-muted-foreground">
										ID: {author.id}
									</span>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
