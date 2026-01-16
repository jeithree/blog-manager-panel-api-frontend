'use client';

import {useState, useEffect, useCallback} from 'react';
import {useRouter, useParams} from 'next/navigation';
import {toast} from 'sonner';
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
import {blogMemberService} from '@/services/blogMember';
import * as userService from '@/services/user';

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
	const [isGeneratingContent, setIsGeneratingContent] = useState(false);
	const [isGeneratingImagePrompt, setIsGeneratingImagePrompt] = useState(false);
	const [imagePrompt, setImagePrompt] = useState('');
	const [copiedPrompt, setCopiedPrompt] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [
		showConfirmRegenerateImagePrompt,
		setShowConfirmRegenerateImagePrompt,
	] = useState(false);
	const [showConfirmRegenerateContent, setShowConfirmRegenerateContent] =
		useState(false);
	const [isEditor, setIsEditor] = useState(false);
	const [aiReviewIssues, setAiReviewIssues] = useState('');
	const [isReviewing, setIsReviewing] = useState(false);

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

				// load existing AI image prompt
				setImagePrompt(postData.AIGeneratedImagePrompt || '');

				// load AI review issues
				setAiReviewIssues(postData.AIPostReviewIssues || '');

				if (postData.publishedAt) {
					const date = new Date(postData.publishedAt);
					console.log(date);

					// Format for datetime-local input (local timezone, not UTC)
					const year = date.getFullYear();
					const month = String(date.getMonth() + 1).padStart(2, '0');
					const day = String(date.getDate()).padStart(2, '0');
					const hours = String(date.getHours()).padStart(2, '0');
					const minutes = String(date.getMinutes()).padStart(2, '0');
					setPublishDate(`${year}-${month}-${day}T${hours}:${minutes}`);
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

				// determine if current user is an editor for this blog
				try {
					const [profileRes, membersRes] = await Promise.all([
						userService.getProfile(),
						blogMemberService.listMembers(postData.blogId),
					]);
					if (profileRes.success && membersRes.success) {
						const me = profileRes.data;
						const member = membersRes.data?.find((m) => m.user.id === me?.id);
						if (member) {
							setIsEditor(member.role === 'EDITOR');
						} else {
							setIsEditor(false);
						}
					}
				} catch (err) {
					console.error('Failed to determine membership role', err);
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
				// Set AI review issues
				setAiReviewIssues(response.data.AIPostReviewIssues || '');

				setShowEditDialog(false);
				setEditRequest('');
			}
		} catch (error) {
			console.error('Failed to generate edit:', error);
		} finally {
			setIsGenerating(false);
		}
	};

	const generateContent = async () => {
		if (!post || !categoryId || !title) return;

		setIsGeneratingContent(true);
		try {
			const response = await creatorService.generatePostContent({
				blogId: post.blogId,
				categoryId,
				title,
				slug,
			});

			if (response.success && response.data) {
				const data = response.data;
				setTitle(data.title || title);
				setDescription(data.description || '');
				setContent(data.content || '');

				// slug is provided by the generator
				setSlug(data.slug);

				// Set AI review issues
				setAiReviewIssues(data.AIPostReviewIssues || '');

				// Map generated tag names to existing tag IDs (do not create new tags)
				if (data.tagNames && data.tagNames.length > 0) {
					const matchedIds = data.tagNames
						.map((name) =>
							tags.find((t) => t.name.toLowerCase() === name.toLowerCase())
						)
						.filter(Boolean)
						.map((t) => (t as Tag).id);

					setSelectedTagIds(matchedIds);
				}
			}
		} catch (error) {
			console.error('Failed to generate content:', error);
		} finally {
			setIsGeneratingContent(false);
		}
	};

	const generateImagePromptFromContent = async () => {
		const blogPost = content || post?.content || '';
		if (!blogPost || !post) return;

		setIsGeneratingImagePrompt(true);
		try {
			const response = await creatorService.generateImagePrompt({
				blogPost,
				blogId: post.blogId,
			});

			if (response.success && response.data) {
				setImagePrompt(response.data.imagePrompt || '');
				toast.success('Image prompt generated successfully');
			} else {
				toast.error(
					response.error?.message || 'Failed to generate image prompt'
				);
			}
		} catch (error) {
			console.error('Failed to generate image prompt:', error);
			toast.error('An unexpected error occurred');
		} finally {
			setIsGeneratingImagePrompt(false);
		}
	};

	const handleGenerateImagePromptClick = () => {
		if ((imagePrompt || '').trim()) {
			setShowConfirmRegenerateImagePrompt(true);
			return;
		}
		generateImagePromptFromContent();
	};

	const handleConfirmGenerateImagePrompt = async () => {
		setShowConfirmRegenerateImagePrompt(false);
		await generateImagePromptFromContent();
	};

	const handleGenerateContentClick = () => {
		if ((content || '').trim()) {
			setShowConfirmRegenerateContent(true);
			return;
		}
		generateContent();
	};

	const handleConfirmGenerateContent = async () => {
		setShowConfirmRegenerateContent(false);
		await generateContent();
	};

	const reviewContent = async () => {
		if (!post || !title || !content) return;

		setIsReviewing(true);
		try {
			const response = await creatorService.reviewPost({
				blogId: post.blogId,
				postTitle: title,
				postDescription: description,
				postContent: content,
			});

			if (response.success && response.data) {
				setAiReviewIssues(response.data.AIPostReviewIssues || '');
				toast.success('Content reviewed successfully');
			} else {
				toast.error(response.error?.message || 'Failed to review content');
			}
		} catch (error) {
			console.error('Failed to review content:', error);
			toast.error('An unexpected error occurred');
		} finally {
			setIsReviewing(false);
		}
	};

	const copyTextToClipboard = async (text: string, isPrompt = false) => {
		try {
			await navigator.clipboard.writeText(text);
			if (isPrompt) {
				setCopiedPrompt(true);
				setTimeout(() => setCopiedPrompt(false), 2000);
			}
			toast.success('Copied to clipboard');
		} catch (err) {
			console.error('Copy failed', err);
			toast.error('Failed to copy to clipboard');
		}
	};

	const handleSave = async (status?: PostStatus) => {
		if (!post) return;

		setIsSaving(true);
		try {
			const publishAtDate = publishDate ? new Date(publishDate) : undefined;
			const updateData = {
				blogId: post.blogId,
				title,
				description,
				slug,
				content,
				categoryId,
				tagIds: selectedTagIds,
				...(status && {status}),
				...(publishAtDate && {publishedAt: publishAtDate}),
				AIGeneratedImagePrompt: imagePrompt,
				AIPostReviewIssues: aiReviewIssues,
			};

			const response = await postService.updatePost(
				post.id,
				updateData,
				imageFile || undefined
			);

			if (response.success) {
				toast.success(response.message || 'Post updated successfully');
				setTimeout(() => {
					router.push('/dashboard/posts');
				}, 500);
			} else {
				toast.error(response.error || 'Failed to update post');
			}
		} catch (error) {
			console.error('Failed to save post:', error);
			toast.error('An unexpected error occurred while saving the post');
		} finally {
			setIsSaving(false);
		}
	};

	const handleExportMarkdown = async () => {
		if (!post) return;

		setIsExporting(true);
		try {
			const response = await postService.exportPostMarkdown(
				post.id,
				post.blogId
			);
			if (!response.success) {
				console.error('Markdown export failed', response.error);
				toast.error(response.error || 'Failed to export markdown');
			} else {
				toast.success(
					'Markdown export triggered – check the content folder once it completes.'
				);
			}
		} catch (error) {
			console.error('Failed to export markdown:', error);
			toast.error('An unexpected error occurred');
		} finally {
			setIsExporting(false);
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
				toast.success('Post deleted successfully');
				setTimeout(() => {
					router.push('/dashboard/posts');
				}, 500);
			} else {
				toast.error(response.error || 'Failed to delete post');
			}
		} catch (error) {
			console.error('Failed to delete post:', error);
			toast.error('An unexpected error occurred');
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
							<CardTitle className="flex items-center gap-2">
								{aiReviewIssues ? (
									<span className="text-yellow-600">⚠️</span>
								) : (
									<span className="text-green-600">✓</span>
								)}
								AI Review Issues
							</CardTitle>
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={reviewContent}
									disabled={isReviewing || !content || !title}>
									{isReviewing ? 'Reviewing...' : 'Review Again'}
								</Button>
								{aiReviewIssues && (
									<Button
										size="sm"
										variant="default"
										onClick={() => {
											setAiReviewIssues('');
											toast.success('Marked as fixed');
										}}>
										Mark as Fixed
									</Button>
								)}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{aiReviewIssues ? (
							<div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
								<p className="text-sm text-yellow-800 mb-3">
									The AI has identified the following issues with the generated
									content:
								</p>
								<div className="space-y-2">
									{aiReviewIssues
										.split('\n')
										.filter((issue) => issue.trim())
										.map((issue, index) => (
											<div
												key={index}
												className="flex gap-2 text-sm text-yellow-800">
												<span className="text-yellow-600 font-bold mt-0.5">
													•
												</span>
												<span className="flex-1">{issue}</span>
											</div>
										))}
								</div>
							</div>
						) : (
							<div className="bg-green-50 border border-green-200 rounded-md p-4">
								<p className="text-sm text-green-800 font-medium">
									No issues found
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex justify-between items-center">
							<CardTitle>Content</CardTitle>
							<div className="flex gap-2">
								{isDraft && (
									<Button
										size="sm"
										variant="outline"
										onClick={handleGenerateContentClick}
										disabled={isGeneratingContent}>
										{isGeneratingContent ? 'Generating...' : 'Generate Content'}
									</Button>
								)}
								<Button
									variant="outline"
									size="sm"
									onClick={() => setShowEditDialog(true)}>
									AI Edit Request
								</Button>
							</div>
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
					<CardContent className="space-y-6">
						<div className="space-y-6">
							<div className="space-y-4">
								<div className="flex justify-between items-center">
									<Label>Image Prompt (for AI generation)</Label>
									<div className="flex gap-2">
										<Button
											size="sm"
											variant="outline"
											onClick={handleGenerateImagePromptClick}
											disabled={isGeneratingImagePrompt}>
											{isGeneratingImagePrompt
												? 'Generating...'
												: 'Generate Prompt'}
										</Button>
										{imagePrompt && (
											<Button
												size="sm"
												className="bg-slate-600 text-white hover:bg-slate-700"
												onClick={() => copyTextToClipboard(imagePrompt, true)}>
												{copiedPrompt ? 'Copied' : 'Copy Prompt'}
											</Button>
										)}
									</div>
								</div>
								<Textarea
									className="max-h-44"
									value={imagePrompt}
									onChange={(e) => {
										setImagePrompt(e.target.value);
										setCopiedPrompt(false);
									}}
									placeholder="Describe the image you want"
								/>
							</div>
							<div className="space-y-4">
								<Label htmlFor="image">Featured Image</Label>
								{post.imageUrl && !imageFile && (
									<div className="mb-2">
										<img
											src={post.imageUrl}
											alt="Current featured image"
											className="max-w-xs rounded-md"
										/>
									</div>
								)}
								<div className="flex items-center gap-2">
									<Input
										id="image"
										type="file"
										accept="image/*"
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (file) setImageFile(file);
										}}
									/>
									<Button
										size="sm"
										className="bg-slate-600 text-white hover:bg-slate-700"
										onClick={() => {
											const el = document.getElementById(
												'image'
											) as HTMLInputElement | null;
											el?.click();
										}}>
										Choose Image
									</Button>
								</div>
							</div>
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
					{isDraft && !isEditor && (
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
					) : isDraft ? (
						<>
							<Button
								variant="outline"
								onClick={() => handleSave(PostStatus.DRAFT)}
								disabled={isSaving}>
								Update Draft
							</Button>
							<Button
								variant="outline"
								onClick={() => handleSave(PostStatus.SCHEDULED)}
								disabled={isSaving || !publishDate}>
								Schedule
							</Button>
							{!isEditor && (
								<>
									<Button
										onClick={() => handleSave(PostStatus.PUBLISHED)}
										disabled={isSaving}>
										{isSaving ? 'Saving...' : 'Publish'}
									</Button>
								</>
							)}
						</>
					) : (
						<>
							<Button
								onClick={() => handleSave(PostStatus.SCHEDULED)}
								disabled={isSaving || !publishDate}>
								{isSaving ? 'Saving...' : 'Update Schedule'}
							</Button>
							<Button
								onClick={() => handleSave(PostStatus.PUBLISHED)}
								disabled={isSaving}>
								{isSaving ? 'Saving...' : 'Publish'}
							</Button>
						</>
					)}
					{!isEditor && (
						<Button
							variant="outline"
							onClick={handleExportMarkdown}
							disabled={!isPublished || isExporting}>
							{isExporting ? 'Exporting...' : 'Export Markdown'}
						</Button>
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

			{/* Confirm regenerate image prompt */}
			<Dialog
				open={showConfirmRegenerateImagePrompt}
				onOpenChange={setShowConfirmRegenerateImagePrompt}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Regenerate Image Prompt?</DialogTitle>
					</DialogHeader>
					<p>
						There is already an image prompt. Regenerating will overwrite it.
						Continue?
					</p>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowConfirmRegenerateImagePrompt(false)}>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmGenerateImagePrompt}
							disabled={isGeneratingImagePrompt}>
							{isGeneratingImagePrompt ? 'Generating...' : 'Regenerate'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Confirm regenerate content */}
			<Dialog
				open={showConfirmRegenerateContent}
				onOpenChange={setShowConfirmRegenerateContent}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Regenerate Content?</DialogTitle>
					</DialogHeader>
					<p>
						There is already content in the editor. Generating new content will
						replace it. Continue?
					</p>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowConfirmRegenerateContent(false)}>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmGenerateContent}
							disabled={isGeneratingContent}>
							{isGeneratingContent ? 'Generating...' : 'Generate'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
