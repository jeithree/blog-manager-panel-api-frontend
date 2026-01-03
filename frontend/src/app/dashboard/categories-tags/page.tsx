'use client';

import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import {categoryService, type Category} from '@/services/category';
import {tagService, type Tag} from '@/services/tag';
import {blogService, type Blog} from '@/services/blog';
import {useSession} from '@/hooks/useSession';
import {Textarea} from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

export default function CategoriesTagsPage() {
	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [blogId, setBlogId] = useState('');
	const [categories, setCategories] = useState<Category[]>([]);
	const [tags, setTags] = useState<Tag[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// Category dialog
	const [showCategoryDialog, setShowCategoryDialog] = useState(false);
	const [newCategoryName, setNewCategoryName] = useState('');
	const [newCategorySlug, setNewCategorySlug] = useState('');
	const [newCategoryDescription, setNewCategoryDescription] = useState('');
	const [isCreatingCategory, setIsCreatingCategory] = useState(false);

	// Tag dialog
	const [showTagDialog, setShowTagDialog] = useState(false);
	const [newTagName, setNewTagName] = useState('');
	const [newTagSlug, setNewTagSlug] = useState('');
	const [isCreatingTag, setIsCreatingTag] = useState(false);
	const {session} = useSession();

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

	const loadData = useCallback(async () => {
		setIsLoading(true);
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
			console.error('Failed to load data:', error);
		} finally {
			setIsLoading(false);
		}
	}, [blogId]);

	useEffect(() => {
		loadBlogs();
	}, [loadBlogs]);

	const visibleBlogs = useMemo(() => {
		if (!session?.user) return [] as Blog[];
		return blogs.filter((b) => b.userId === session.user!.id);
	}, [blogs, session]);

	useEffect(() => {
		if (!visibleBlogs.length) {
			setBlogId('');
			return;
		}
		if (!blogId || !visibleBlogs.some((b) => b.id === blogId)) {
			setBlogId(visibleBlogs[0].id);
		}
	}, [visibleBlogs, blogId]);

	useEffect(() => {
		if (blogId) {
			loadData();
		}
	}, [blogId, loadData]);

	const handleCreateCategory = async () => {
		if (!newCategoryName || !blogId || !newCategorySlug) return;

		setIsCreatingCategory(true);
		try {
			const response = await categoryService.createCategory({
				name: newCategoryName,
				blogId,
				slug: newCategorySlug,
				description: newCategoryDescription,
			});

			if (response.success && response.data) {
				setCategories((prev) => [...prev, response.data!]);
				setShowCategoryDialog(false);
				setNewCategoryName('');
				setNewCategorySlug('');
				setNewCategoryDescription('');
			}
		} catch (error) {
			console.error('Failed to create category:', error);
			alert('Failed to create category');
		} finally {
			setIsCreatingCategory(false);
		}
	};

	const handleCreateTag = async () => {
		if (!newTagName || !blogId || !newTagSlug) return;

		setIsCreatingTag(true);
		try {
			const response = await tagService.createTag({
				name: newTagName,
				blogId,
				slug: newTagSlug,
			});

			if (response.success && response.data) {
				setTags((prev) => [...prev, response.data!]);
				setShowTagDialog(false);
				setNewTagName('');
				setNewTagSlug('');
			}
		} catch (error) {
			console.error('Failed to create tag:', error);
			alert('Failed to create tag');
		} finally {
			setIsCreatingTag(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Categories & Tags</h1>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Blog Selection</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Label htmlFor="blogId">Select Blog</Label>
						<Select
							value={blogId}
							onValueChange={setBlogId}>
							<SelectTrigger>
								<SelectValue placeholder="Select a blog" />
							</SelectTrigger>
							<SelectContent>
								{visibleBlogs.map((blog) => (
									<SelectItem
										key={blog.id}
										value={blog.id}>
										{blog.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{blogId && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<Card>
						<CardHeader>
							<div className="flex justify-between items-center">
								<CardTitle>Categories</CardTitle>
								<Button
									size="sm"
									onClick={() => setShowCategoryDialog(true)}
									disabled={!blogId}>
									Add Category
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{categories.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-4">
									No categories yet
								</p>
							) : (
								<div className="space-y-2">
									{categories.map((category) => (
										<div
											key={category.id}
											className="flex items-center justify-between p-3 border rounded-md">
											<div>
												<p className="font-medium">{category.name}</p>
												<p className="text-xs text-muted-foreground">
													{new Date(category.createdAt).toLocaleDateString()}
												</p>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<div className="flex justify-between items-center">
								<CardTitle>Tags</CardTitle>
								<Button
									size="sm"
									onClick={() => setShowTagDialog(true)}
									disabled={!blogId}>
									Add Tag
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{tags.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-4">
									No tags yet
								</p>
							) : (
								<div className="flex flex-wrap gap-2">
									{tags.map((tag) => (
										<Badge
											key={tag.id}
											variant="secondary">
											{tag.name}
										</Badge>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}

			{/* Create Category Dialog */}
			<Dialog
				open={showCategoryDialog}
				onOpenChange={setShowCategoryDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Category</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="categoryName">Category Name</Label>
							<Input
								id="categoryName"
								value={newCategoryName}
								onChange={(e) => setNewCategoryName(e.target.value)}
								placeholder="Enter category name"
								onKeyDown={(e) =>
									e.key === 'Enter' &&
									!isCreatingCategory &&
									handleCreateCategory()
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="categorySlug">Slug</Label>
							<Input
								id="categorySlug"
								value={newCategorySlug}
								onChange={(e) => setNewCategorySlug(e.target.value)}
								placeholder="enter-category-slug"
								onKeyDown={(e) =>
									e.key === 'Enter' &&
									!isCreatingCategory &&
									handleCreateCategory()
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="categoryDescription">Description</Label>
							<Textarea
								id="categoryDescription"
								value={newCategoryDescription}
								onChange={(e) => setNewCategoryDescription(e.target.value)}
								placeholder="description for the category"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setShowCategoryDialog(false);
								setNewCategoryName('');
								setNewCategorySlug('');
								setNewCategoryDescription('');
							}}>
							Cancel
						</Button>
						<Button
							onClick={handleCreateCategory}
							disabled={
								isCreatingCategory || !newCategoryName || !newCategorySlug
							}>
							{isCreatingCategory ? 'Creating...' : 'Create'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Create Tag Dialog */}
			<Dialog
				open={showTagDialog}
				onOpenChange={setShowTagDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Tag</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="tagName">Tag Name</Label>
							<Input
								id="tagName"
								value={newTagName}
								onChange={(e) => setNewTagName(e.target.value)}
								placeholder="Enter tag name"
								onKeyDown={(e) =>
									e.key === 'Enter' && !isCreatingTag && handleCreateTag()
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="tagSlug">Slug</Label>
							<Input
								id="tagSlug"
								value={newTagSlug}
								onChange={(e) => setNewTagSlug(e.target.value)}
								placeholder="enter-tag-slug"
								onKeyDown={(e) =>
									e.key === 'Enter' && !isCreatingTag && handleCreateTag()
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setShowTagDialog(false);
								setNewTagName('');
								setNewTagSlug('');
							}}>
							Cancel
						</Button>
						<Button
							onClick={handleCreateTag}
							disabled={isCreatingTag || !newTagName || !newTagSlug}>
							{isCreatingTag ? 'Creating...' : 'Create'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
