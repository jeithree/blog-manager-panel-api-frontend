'use client';

import {useState, useEffect, useCallback} from 'react';
import {useRouter, useParams} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {MarkdownEditor} from '@/components/MarkdownEditor';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import {Textarea} from '@/components/ui/textarea';
import {postService, type Post, PostStatus} from '@/services/post';
import {categoryService, type Category} from '@/services/category';
import {tagService, type Tag} from '@/services/tag';
import {creatorService} from '@/services/creator';

export default function EditPostPage() {
	const router = useRouter();
	const params = useParams();
	const postId = params.postId as string;

	const [post, setPost] = useState<Post | null>(null);
	const [categories, setCategories] = useState<Category[]>([]);
	const [tags, setTags] = useState<Tag[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [slug, setSlug] = useState('');
	const [content, setContent] = useState('');
	const [categoryId, setCategoryId] = useState('');
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [publishDate, setPublishDate] = useState('');

	// AI edit dialog
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [editRequest, setEditRequest] = useState('');
	const [isGenerating, setIsGenerating] = useState(false);

	const loadPost = useCallback(async () => {
		setIsLoading(true);
		try {
			// Get blogId from query param
			const blogId =
				new URLSearchParams(window.location.search).get('blogId') || '';

			if (!blogId) {
				console.error('Blog ID is required');
				return;
			}

			const response = await postService.getPostById(postId, blogId);

			if (response.success && response.data) {
				const postData = response.data;
				setPost(postData);
				setTitle(postData.title);
				setDescription(postData.description || '');
				setSlug(postData.slug);
				setContent(postData.content || '');
				setCategoryId(postData.categoryId);
				setSelectedTagIds(postData.tags?.map((t) => t.id) || []);

				if (postData.publishedAt) {
					const date = new Date(postData.publishedAt);
					setPublishDate(date.toISOString().slice(0, 16));
				}

				// Load categories and tags
				const [categoriesRes, tagsRes] = await Promise.all([
					categoryService.getCategories({blogId: postData.blogId}),
					tagService.getTags({blogId: postData.blogId}),
				]);

				if (categoriesRes.success && categoriesRes.data) {
					setCategories(categoriesRes.data);
				}
				if (tagsRes.success && tagsRes.data) {
					setTags(tagsRes.data);
				}
			}
		} catch (error) {
			console.error('Failed to load post:', error);
		} finally {
			setIsLoading(false);
		}
	}, [postId]);

	useEffect(() => {
		loadPost();
	}, [loadPost]);

	const handleAIEdit = async () => {
		if (!editRequest || !post) return;

		setIsGenerating(true);
		try {
			const response = await creatorService.generatePostEdit({
				blogId: post.blogId,
				postId: post.id,
				changeRequest: editRequest,
			});

			if (response.success && response.data) {
				setContent(response.data.content);
				setShowEditDialog(false);
				setEditRequest('');
			}
		} catch (error) {
			console.error('Failed to generate edit:', error);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleSave = async (status?: PostStatus) => {
		if (!post) return;

		setIsSaving(true);
		try {
			const updateData = {
				blogId: post.blogId,
				title,
				description,
				slug,
				content,
				categoryId,
				tagIds: selectedTagIds,
				...(status && {status}),
				...(status === PostStatus.SCHEDULED &&
					publishDate && {
						publishedAt: new Date(publishDate),
					}),
			};

			const response = await postService.updatePost(
				post.id,
				updateData,
				imageFile || undefined
			);

			if (response.success) {
				router.push('/dashboard/posts');
			}
		} catch (error) {
			console.error('Failed to save post:', error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!post || post.status !== PostStatus.DRAFT) return;
		const confirmed = window.confirm(
			'Delete this draft? This action cannot be undone.'
		);
		if (!confirmed) return;

		setIsDeleting(true);
		try {
			const response = await postService.deletePost(post.id);
			if (response.success) {
				router.push('/dashboard/posts');
			}
		} catch (error) {
			console.error('Failed to delete post:', error);
		} finally {
			setIsDeleting(false);
		}
	};

	const isPublished = post?.status === PostStatus.PUBLISHED;
	const isDraft = post?.status === PostStatus.DRAFT;

	if (isLoading) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-8">
				<div className="text-center">Loading post...</div>
			</div>
		);
	}

	if (!post) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-8">
				<div className="text-center">Post not found</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto px-4 py-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">Edit Post</h1>
				<Badge
					variant={
						post.status === PostStatus.PUBLISHED ? 'default' : 'secondary'
					}>
					{post.status}
				</Badge>
			</div>

			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="title">Title</Label>
							<Input
								id="title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="slug">Slug</Label>
							<Input
								id="slug"
								value={slug}
								onChange={(e) => setSlug(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="category">Category</Label>
							<Select
								value={categoryId}
								onValueChange={setCategoryId}>
								<SelectTrigger>
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
								<SelectContent>
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

						<div className="space-y-2">
							<Label>Tags</Label>
							<Select
								value=""
								onValueChange={(tagId) => {
									if (!selectedTagIds.includes(tagId)) {
										setSelectedTagIds((prev) => [...prev, tagId]);
									}
								}}>
								<SelectTrigger>
									<SelectValue placeholder="Add tags" />
								</SelectTrigger>
								<SelectContent>
									{tags.map((tag) => (
										<SelectItem
											key={tag.id}
											value={tag.id}>
											{tag.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<div className="flex flex-wrap gap-2 mt-2">
								{selectedTagIds.map((tagId) => {
									const tag = tags.find((t) => t.id === tagId);
									return (
										<Badge
											key={tagId}
											variant="outline"
											className="cursor-pointer"
											onClick={() =>
												setSelectedTagIds((prev) =>
													prev.filter((id) => id !== tagId)
												)
											}>
											{tag?.name} ×
										</Badge>
									);
								})}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex justify-between items-center">
							<CardTitle>Content</CardTitle>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowEditDialog(true)}>
								AI Edit Request
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<MarkdownEditor
							value={content}
							onChange={setContent}
							minHeight="500px"
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Media & Publishing</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="image">Featured Image</Label>
							{post.imageUrl && !imageFile && (
								<div className="mb-2">
									<Image
										src={post.imageUrl}
										alt="Current featured image"
										className="max-w-xs rounded-md"
									/>
								</div>
							)}
							<Input
								id="image"
								type="file"
								accept="image/*"
								onChange={(e) => setImageFile(e.target.files?.[0] || null)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="publishDate">Publish Date (for scheduling)</Label>
							<Input
								id="publishDate"
								type="datetime-local"
								value={publishDate}
								onChange={(e) => setPublishDate(e.target.value)}
							/>
						</div>
					</CardContent>
				</Card>

				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						onClick={() => router.push('/dashboard/posts')}
						disabled={isSaving}>
						Cancel
					</Button>
					{isDraft && (
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={isSaving || isDeleting}>
							{isDeleting ? 'Deleting...' : 'Delete Draft'}
						</Button>
					)}
					{isPublished ? (
						<Button
							onClick={() => handleSave()}
							disabled={isSaving}>
							{isSaving ? 'Saving...' : 'Update Post'}
						</Button>
					) : (
						<>
							<Button
								variant="outline"
								onClick={() => handleSave(PostStatus.DRAFT)}
								disabled={isSaving}>
								Save as Draft
							</Button>
							<Button
								variant="outline"
								onClick={() => handleSave(PostStatus.SCHEDULED)}
								disabled={isSaving || !publishDate}>
								Schedule
							</Button>
							<Button
								onClick={() => handleSave(PostStatus.PUBLISHED)}
								disabled={isSaving}>
								{isSaving ? 'Saving...' : 'Publish'}
							</Button>
						</>
					)}
				</div>
			</div>

			<Dialog
				open={showEditDialog}
				onOpenChange={setShowEditDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>AI Edit Request</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="editRequest">
								What would you like to change?
							</Label>
							<Textarea
								id="editRequest"
								value={editRequest}
								onChange={(e) => setEditRequest(e.target.value)}
								placeholder="E.g., Make the tone more professional, add more examples, shorten the introduction..."
								rows={4}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setShowEditDialog(false);
								setEditRequest('');
							}}>
							Cancel
						</Button>
						<Button
							onClick={handleAIEdit}
							disabled={isGenerating || !editRequest}>
							{isGenerating ? 'Generating...' : 'Generate Edit'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
