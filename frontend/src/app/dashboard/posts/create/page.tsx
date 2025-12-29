'use client';

import React, {useState, useEffect, useCallback} from 'react';
import {useRouter} from 'next/navigation';
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
import {creatorService} from '@/services/creator';
import {postService, PostStatus} from '@/services/post';
import {categoryService, type Category} from '@/services/category';
import {tagService, type Tag} from '@/services/tag';
import {blogService, type Blog} from '@/services/blog';
import {authorService, type Author} from '@/services/author';
import {Textarea} from '@/components/ui/textarea';

type Step = 'blog' | 'title' | 'content' | 'details' | 'publish';
const stepOrder: Step[] = ['blog', 'title', 'content', 'details', 'publish'];

export default function CreatePostPage() {
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState<Step>('blog');
	const [isLoading, setIsLoading] = useState(false);

	// Form data
	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [selectedBlogId, setSelectedBlogId] = useState('');
	const [categories, setCategories] = useState<Category[]>([]);
	const [tags, setTags] = useState<Tag[]>([]);
	const [authors, setAuthors] = useState<Author[]>([]);

	const [titleSuggestions, setTitleSuggestions] = useState<
		{category: string; titles: string[]; categoryId: string | null}[]
	>([]);
	const [selectedTitle, setSelectedTitle] = useState('');
	const [customTitle, setCustomTitle] = useState('');

	const [selectedCategoryId, setSelectedCategoryId] = useState('');
	const [content, setContent] = useState('');
	const [description, setDescription] = useState('');
	const [generatedTags, setGeneratedTags] = useState<string[]>([]);
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

	const [slug, setSlug] = useState('');
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePrompt, setImagePrompt] = useState('');
	const [copiedText, setCopiedText] = useState('');
	const [copiedPrompt, setCopiedPrompt] = useState(false);
	const [publishDate, setPublishDate] = useState<string>('');
	const [selectedAuthorId, setSelectedAuthorId] = useState('');

	const loadBlogs = useCallback(async () => {
		try {
			const response = await blogService.getBlogs();
			if (response.success && response.data) {
				setBlogs(response.data);
				if (response.data.length > 0 && !selectedBlogId) {
					setSelectedBlogId(response.data[0].id);
				}
			}
		} catch (error) {
			console.error('Failed to load blogs:', error);
		}
	}, [selectedBlogId]);

	const loadCategoriesTagsAndAuthors = useCallback(async () => {
		try {
			const [categoriesRes, tagsRes, authorsRes] = await Promise.all([
				categoryService.getCategories({blogId: selectedBlogId}),
				tagService.getTags({blogId: selectedBlogId}),
				authorService.getAuthors(selectedBlogId),
			]);

			if (categoriesRes.success && categoriesRes.data) {
				setCategories(categoriesRes.data);
			}
			if (tagsRes.success && tagsRes.data) {
				setTags(tagsRes.data);
			}
			if (authorsRes.success && authorsRes.data) {
				setAuthors(authorsRes.data);
				setSelectedAuthorId(authorsRes.data[0]?.id || '');
			}
		} catch (error) {
			console.error('Failed to load categories, tags, and authors:', error);
		}
	}, [selectedBlogId]);

	const saveTags = useCallback(async () => {
		if (generatedTags.length === 0) return;

		const newTagIds: string[] = [];

		for (const tagName of generatedTags) {
			// Check if tag already exists
			const existingTag = tags.find(
				(t) => t.name.toLowerCase() === tagName.toLowerCase()
			);

			if (existingTag) {
				newTagIds.push(existingTag.id);
			} else {
				// Create new tag
				try {
					const slugified = tagName
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, '-')
						.replace(/^-+|-+$/g, '');

					const response = await tagService.createTag({
						name: tagName,
						blogId: selectedBlogId,
						slug: slugified,
					});

					if (response.success && response.data) {
						newTagIds.push(response.data.id);
						setTags((prev) => [...prev, response.data!]);
					}
				} catch (error) {
					console.error(`Failed to create tag: ${tagName}`, error);
				}
			}
		}

		// Add generated tag IDs without duplicates
		setSelectedTagIds((prev) => {
			const combined = [...prev, ...newTagIds];
			return [...new Set(combined)];
		});

		// Clear generated tags after processing
		setGeneratedTags([]);
	}, [generatedTags, selectedBlogId, tags]);

	// Load blogs on mount
	useEffect(() => {
		loadBlogs();
	}, [loadBlogs]);

	useEffect(() => {
		if (selectedBlogId) {
			loadCategoriesTagsAndAuthors();
		}
	}, [loadCategoriesTagsAndAuthors, selectedBlogId]);

	// Auto-process generated tags when they're available
	useEffect(() => {
		if (generatedTags.length > 0 && currentStep === 'details') {
			void saveTags();
		}
	}, [currentStep, generatedTags, saveTags]);

	const generateTitles = async () => {
		if (!selectedBlogId) return;

		setIsLoading(true);
		try {
			const response = await creatorService.generateTitleSuggestions(
				selectedBlogId
			);
			if (response.success && response.data) {
				// Keep the grouped structure
				setTitleSuggestions(response.data);
			}
		} catch (error) {
			console.error('Failed to generate titles:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const generateContent = async () => {
		if (!selectedBlogId || !selectedCategoryId || !getSelectedTitle()) return;

		setIsLoading(true);
		try {
			const response = await creatorService.generatePostContent({
				blogId: selectedBlogId,
				categoryId: selectedCategoryId,
				title: getSelectedTitle(),
			});

			if (response.success && response.data) {
				setContent(response.data.content);
				setDescription(response.data.description);
				setGeneratedTags(response.data.tagNames || []);

				// Auto-generate slug from title
				const slugified = getSelectedTitle()
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, '-')
					.replace(/^-+|-+$/g, '');
				setSlug(slugified);
			}
		} catch (error) {
			console.error('Failed to generate content:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const generateImagePromptFromContent = async () => {
		if (!content) return;

		setIsLoading(true);
		try {
			const response = await creatorService.generateImagePrompt({
				blogPost: content,
			});

			if (response.success && response.data) {
				setImagePrompt(response.data.imagePrompt || '');
			}
		} catch (error) {
			console.error('Failed to generate image prompt:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const copyTextToClipboard = async (text: string, isPrompt = false) => {
		try {
			await navigator.clipboard.writeText(text);
			if (isPrompt) {
				setCopiedPrompt(true);
				setTimeout(() => setCopiedPrompt(false), 2000);
			} else {
				setCopiedText(text);
				setTimeout(() => setCopiedText(''), 2000);
			}
		} catch (err) {
			console.error('Copy failed', err);
		}
	};

	const hasUnsavedChanges = useCallback(() => {
		return Boolean(
			selectedBlogId ||
				customTitle ||
				selectedTitle ||
				content ||
				description ||
				slug ||
				imageFile ||
				imagePrompt ||
				selectedCategoryId ||
				selectedTagIds.length > 0 ||
				selectedAuthorId
		);
	}, [
		selectedBlogId,
		selectedTitle,
		customTitle,
		content,
		description,
		slug,
		imageFile,
		imagePrompt,
		selectedCategoryId,
		selectedTagIds,
		selectedAuthorId,
	]);

	useEffect(() => {
		const onBeforeUnload = (e: BeforeUnloadEvent) => {
			if (hasUnsavedChanges()) {
				e.preventDefault();
				// Chrome requires returnValue to be set
				e.returnValue = '';
			}
		};

		const onDocClick = (e: MouseEvent) => {
			try {
				const target = e.target as Element | null;
				if (!target) return;
				const anchor =
					target.closest && (target.closest('a') as HTMLAnchorElement | null);
				if (!anchor) return;
				const href = anchor.getAttribute('href');
				if (!href) return;
				// ignore anchors that open in new tab or external links
				if (anchor.target === '_blank') return;
				if (href.startsWith('mailto:') || href.startsWith('tel:')) return;
				const url = new URL(href, window.location.href);
				if (url.origin !== window.location.origin) return;
				if (hasUnsavedChanges()) {
					const ok = window.confirm(
						'You have unsaved changes. Leaving this page will discard them. Do you want to continue?'
					);
					if (!ok) {
						e.preventDefault();
						e.stopImmediatePropagation();
					}
				}
			} catch (err) {
				// ignore
			}
		};

		const onPopState = (_e: PopStateEvent) => {
			if (hasUnsavedChanges()) {
				const ok = window.confirm(
					'You have unsaved changes. Leaving this page will discard them. Do you want to continue?'
				);
				if (!ok) {
					// re-add the current history entry to cancel navigation
					history.pushState(null, '', window.location.href);
				}
			}
		};

		document.addEventListener('click', onDocClick, true);
		window.addEventListener('popstate', onPopState);
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => {
			document.removeEventListener('click', onDocClick, true);
			window.removeEventListener('popstate', onPopState);
			window.removeEventListener('beforeunload', onBeforeUnload);
		};
	}, [hasUnsavedChanges]);

	const handlePublish = async (status: PostStatus) => {
		if (
			!selectedBlogId ||
			!getSelectedTitle() ||
			!content ||
			!selectedCategoryId ||
			!selectedAuthorId
		) {
			alert('Please fill in all required fields');
			return;
		}

		setIsLoading(true);
		try {
			const postData = {
				blogId: selectedBlogId,
				title: getSelectedTitle(),
				description,
				slug,
				content,
				categoryId: selectedCategoryId,
				authorId: selectedAuthorId,
				tagIds: selectedTagIds,
				status,
				publishedAt:
					status === PostStatus.SCHEDULED && publishDate
						? new Date(publishDate)
						: undefined,
			};

			const response = await postService.createPost(
				postData,
				imageFile || undefined
			);

			if (response.success) {
				router.push('/dashboard/posts');
			}
		} catch (error) {
			console.error('Failed to create post:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const getSelectedTitle = () => customTitle || selectedTitle;

	const renderBlogStep = () => (
		<Card>
			<CardHeader>
				<CardTitle>Select Blog</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="blog">Blog</Label>
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
					<p className="text-xs text-muted-foreground mt-1">
						Select the blog where you want to create this post
					</p>
				</div>

				<Button
					onClick={() => selectedBlogId && setCurrentStep('title')}
					disabled={!selectedBlogId}>
					Continue
				</Button>
			</CardContent>
		</Card>
	);

	const renderTitleStep = () => (
		<Card>
			<CardHeader>
				<CardTitle>Choose or Generate Title</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<Button
					onClick={generateTitles}
					disabled={isLoading}>
					{isLoading ? 'Generating...' : 'Generate Title Suggestions'}
				</Button>

				{titleSuggestions.length > 0 && (
					<div className="space-y-6">
						<Label>Select a title</Label>
						{titleSuggestions.map((categoryGroup, groupIdx) => (
							<div
								key={groupIdx}
								className="space-y-2">
								<h3 className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded">
									{categoryGroup.category}
								</h3>
								{categoryGroup.titles.map((title, idx) => (
									<div
										key={idx}
										className={`p-3 border rounded-md transition ${
											selectedTitle === title
												? 'border-primary bg-primary/10'
												: 'hover:border-primary/50 cursor-pointer'
										}`}>
										<div className="flex items-center justify-between gap-4">
											<div
												className="flex-1"
												onClick={() => {
													setSelectedTitle(title);
													setSelectedCategoryId(categoryGroup.categoryId || '');
													setCustomTitle('');
												}}>
												{title}
											</div>
											<Button
												size="sm"
												variant="outline"
												onClick={(e) => {
													e.stopPropagation();
													copyTextToClipboard(title);
												}}>
												{copiedText === title ? 'Copied' : 'Copy'}
											</Button>
										</div>
									</div>
								))}
							</div>
						))}
					</div>
				)}

				<div className="space-y-2">
					<Label htmlFor="customTitle">Or enter custom title</Label>
					<Input
						id="customTitle"
						placeholder="Enter your own title"
						value={customTitle}
						onChange={(e) => {
							setCustomTitle(e.target.value);
							setSelectedTitle('');
						}}
					/>
					{customTitle && (
						<div className="space-y-2 mt-2">
							<Label htmlFor="manualCategory">
								Select category for custom title
							</Label>
							<Select
								value={selectedCategoryId}
								onValueChange={setSelectedCategoryId}>
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
					)}
				</div>

				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() => setCurrentStep('blog')}>
						Back
					</Button>
					<Button
						onClick={() => setCurrentStep('content')}
						disabled={!getSelectedTitle()}>
						Continue
					</Button>
				</div>
			</CardContent>
		</Card>
	);

	const renderContentStep = () => (
		<Card>
			<CardHeader>
				<CardTitle>Generate Content</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="p-4 bg-muted rounded-md">
					<p className="font-semibold">Selected Title:</p>
					<p>{getSelectedTitle()}</p>
				</div>

				{!content && (
					<Button
						onClick={generateContent}
						disabled={isLoading}>
						{isLoading ? 'Generating...' : 'Generate Post Content'}
					</Button>
				)}

				{content && (
					<>
						<div className="space-y-2">
							<Label>Description</Label>
							<Input
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Post description"
							/>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label>Content</Label>
								<Button
									size="sm"
									variant="outline"
									onClick={generateContent}
									disabled={isLoading}>
									Regenerate
								</Button>
							</div>
							<MarkdownEditor
								value={content}
								onChange={setContent}
							/>
						</div>

						{generatedTags.length > 0 && (
							<div className="space-y-2">
								<Label>Generated Tags</Label>
								<div className="flex flex-wrap gap-2">
									{generatedTags.map((tag, idx) => (
										<Badge
											key={idx}
											variant="secondary">
											{tag}
										</Badge>
									))}
								</div>
							</div>
						)}
					</>
				)}

				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() => setCurrentStep('title')}>
						Back
					</Button>
					<Button
						onClick={() => setCurrentStep('details')}
						disabled={!content}>
						Continue
					</Button>
				</div>
			</CardContent>
		</Card>
	);

	const renderDetailsStep = () => (
		<Card>
			<CardHeader>
				<CardTitle>Post Details</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="slug">Slug</Label>
					<Input
						id="slug"
						value={slug}
						onChange={(e) => setSlug(e.target.value)}
						placeholder="post-slug"
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="image">Featured Image</Label>
					<Input
						id="image"
						type="file"
						accept="image/*"
						onChange={(e) => setImageFile(e.target.files?.[0] || null)}
					/>
				</div>

				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<Label>Image Prompt (for AI generation)</Label>
						<div className="flex gap-2">
							<Button
								size="sm"
								variant="outline"
								onClick={generateImagePromptFromContent}
								disabled={isLoading}>
								{isLoading ? 'Generating...' : 'Generate Prompt'}
							</Button>
							{imagePrompt && (
								<Button
									size="sm"
									variant="outline"
									onClick={() => copyTextToClipboard(imagePrompt, true)}>
									{copiedPrompt ? 'Copied' : 'Copy Prompt'}
								</Button>
							)}
						</div>
					</div>
					<Textarea
						value={imagePrompt}
						onChange={(e) => {
							setImagePrompt(e.target.value);
							setCopiedPrompt(false);
						}}
						placeholder="Describe the image you want"
					/>
				</div>

				<div className="space-y-2">
					<Label>Additional Tags</Label>
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

				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() => setCurrentStep('content')}>
						Back
					</Button>
					<Button
						onClick={() => setCurrentStep('publish')}
						disabled={!imageFile && !imagePrompt}>
						Continue
					</Button>
				</div>
				{!imageFile && !imagePrompt && (
					<p className="text-xs text-muted-foreground">
						Please provide a featured image or an image prompt before
						continuing.
					</p>
				)}
			</CardContent>
		</Card>
	);

	const renderPublishStep = () => (
		<Card>
			<CardHeader>
				<CardTitle>Publish Post</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="p-4 bg-muted rounded-md space-y-2">
					<p>
						<strong>Title:</strong> {getSelectedTitle()}
					</p>
					<p>
						<strong>Slug:</strong> {slug}
					</p>
					<p>
						<strong>Category:</strong>{' '}
						{categories.find((c) => c.id === selectedCategoryId)?.name}
					</p>
					<p>
						<strong>Tags:</strong>{' '}
						{selectedTagIds.length + generatedTags.length}
					</p>
					<p>
						<strong>Author:</strong>{' '}
						{authors.find((a) => a.id === selectedAuthorId)?.name ||
							'Not selected'}
					</p>
				</div>

				<div className="space-y-2">
					<Label>Author</Label>
					<Select
						value={selectedAuthorId}
						onValueChange={setSelectedAuthorId}>
						<SelectTrigger>
							<SelectValue placeholder="Select an author" />
						</SelectTrigger>
						<SelectContent>
							{authors.map((author) => (
								<SelectItem
									key={author.id}
									value={author.id}>
									{author.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="publishDate">Schedule for later (optional)</Label>
					<Input
						id="publishDate"
						type="datetime-local"
						value={publishDate}
						onChange={(e) => setPublishDate(e.target.value)}
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
					<Button
						variant="outline"
						onClick={() => handlePublish(PostStatus.DRAFT)}
						disabled={isLoading}>
						Save as Draft
					</Button>
					<Button
						variant="outline"
						onClick={() => handlePublish(PostStatus.SCHEDULED)}
						disabled={isLoading || !publishDate}>
						Schedule
					</Button>
					<Button
						onClick={() => handlePublish(PostStatus.PUBLISHED)}
						disabled={isLoading}>
						{isLoading ? 'Publishing...' : 'Publish Now'}
					</Button>
				</div>

				<Button
					variant="outline"
					onClick={() => setCurrentStep('details')}
					className="w-full">
					Back
				</Button>
			</CardContent>
		</Card>
	);

	const steps: Record<Step, () => React.ReactNode> = {
		blog: renderBlogStep,
		title: renderTitleStep,
		content: renderContentStep,
		details: renderDetailsStep,
		publish: renderPublishStep,
	};

	return (
		<div className="max-w-6xl mx-auto space-y-6">
			<div className="flex flex-col gap-3">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							Create New Post
						</h1>
						<p className="text-muted-foreground">
							Draft, schedule, or publish with AI-generated content and quick
							metadata.
						</p>
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					{stepOrder.map((step, idx) => {
						const isActive = stepOrder.indexOf(currentStep) >= idx;
						const isCurrent = currentStep === step;
						return (
							<div
								key={step}
								className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm capitalize transition ${
									isCurrent
										? 'border-primary/50 bg-primary/10 text-foreground shadow-sm'
										: isActive
										? 'border-muted bg-muted/60 text-foreground'
										: 'border-muted text-muted-foreground'
								}`}>
								<span
									className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
										isCurrent
											? 'bg-primary text-primary-foreground'
											: 'bg-muted text-muted-foreground'
									}`}>
									{idx + 1}
								</span>
								<span>{step}</span>
							</div>
						);
					})}
				</div>
			</div>

			<div className="grid lg:grid-cols-[2fr,1fr] gap-6">
				<div className="space-y-6">{steps[currentStep]()}</div>
				<div className="hidden lg:block">
					<Card className="sticky top-24 shadow-sm">
						<CardHeader>
							<CardTitle className="text-base">Live Summary</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3 text-sm">
							<div className="flex items-start justify-between gap-3">
								<span className="text-muted-foreground">Blog</span>
								<span className="font-medium">
									{blogs.find((b) => b.id === selectedBlogId)?.title ||
										'Not selected'}
								</span>
							</div>
							<div className="flex items-start justify-between gap-3">
								<span className="text-muted-foreground">Title</span>
								<span className="font-medium truncate max-w-60">
									{getSelectedTitle() || 'Not set'}
								</span>
							</div>
							<div className="flex items-start justify-between gap-3">
								<span className="text-muted-foreground">Category</span>
								<span className="font-medium">
									{categories.find((c) => c.id === selectedCategoryId)?.name ||
										'Not set'}
								</span>
							</div>
							<div className="flex items-start justify-between gap-3">
								<span className="text-muted-foreground">Tags</span>
								<span className="font-medium">
									{selectedTagIds.length + generatedTags.length}
								</span>
							</div>
							<div className="flex items-start justify-between gap-3">
								<span className="text-muted-foreground">Author</span>
								<span className="font-medium">
									{authors.find((a) => a.id === selectedAuthorId)?.name ||
										'Not set'}
								</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
