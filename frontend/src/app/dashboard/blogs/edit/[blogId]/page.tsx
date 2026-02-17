'use client';

import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {useRouter, useParams} from 'next/navigation';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {blogService, type Blog} from '@/services/blog';
import {blogMemberService, type BlogMember} from '@/services/blogMember';
import {useSession} from '@/hooks/useSession';

export default function EditBlogPage() {
	const router = useRouter();
	const params = useParams();
	const blogId = params.blogId as string;

	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [blog, setBlog] = useState<Blog | null>(null);

	const [formData, setFormData] = useState({
		title: '',
		domain: '',
		description: '',
		netlifySiteId: '',
		netlifyToken: '',
		R2AccessKeyId: '',
		R2SecretAccessKey: '',
		R2AccountId: '',
		R2BucketName: '',
		R2CustomDomain: '',
		openAIApiKey: '',
		isActive: true,
	});

	// Members
	const [members, setMembers] = useState<BlogMember[]>([]);
	const [loadingMembers, setLoadingMembers] = useState(false);
	const [newMemberUserId, setNewMemberUserId] = useState('');
	const {session} = useSession();

	const isOwner = useMemo(() => {
		if (!blog || !session?.user) return false;
		return blog.userId === session.user.id;
	}, [blog, session]);

	const loadMembers = useCallback(async () => {
		setLoadingMembers(true);
		try {
			const res = await blogMemberService.listMembers(blogId);
			if (res.success && res.data) setMembers(res.data);
		} catch (err) {
			console.error('Failed to load members', err);
		} finally {
			setLoadingMembers(false);
		}
	}, [blogId]);

	const loadBlog = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await blogService.getBlog(blogId);

			if (response.success && response.data) {
				const blogData = response.data;
				setBlog(blogData);
				setFormData({
					title: blogData.title ?? '',
					domain: blogData.domain ?? '',
					description: blogData.description ?? '',
					netlifySiteId: blogData.netlifySiteId ?? '',
					netlifyToken: blogData.netlifyToken ?? '',
					R2AccessKeyId: blogData.R2AccessKeyId ?? '',
					R2SecretAccessKey: blogData.R2SecretAccessKey ?? '',
					R2AccountId: blogData.R2AccountId ?? '',
					R2BucketName: blogData.R2BucketName ?? '',
					R2CustomDomain: blogData.R2CustomDomain ?? '',
					openAIApiKey: blogData.openAIApiKey ?? '',
					isActive: blogData.isActive ?? true,
				});
			}
		} catch (error) {
			console.error('Failed to load blog:', error);
		} finally {
			setIsLoading(false);
		}
	}, [blogId]);

	useEffect(() => {
		loadBlog();
		loadMembers();
	}, [loadBlog, loadMembers]);

	const handleChange = (field: string, value: string | boolean) => {
		setFormData((prev) => ({...prev, [field]: value}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isOwner) return;
		setIsSaving(true);

		try {
			// Filter out masked credential values to prevent overwriting actual credentials
			const MASKED_VALUE = '••••••••••••';
			const updateData: Partial<typeof formData> = {...formData};

			if (updateData.netlifyToken === MASKED_VALUE) {
				delete updateData.netlifyToken;
			}
			if (updateData.R2SecretAccessKey === MASKED_VALUE) {
				delete updateData.R2SecretAccessKey;
			}
			if (updateData.openAIApiKey === MASKED_VALUE) {
				delete updateData.openAIApiKey;
			}

			const response = await blogService.updateBlog(blogId, updateData);

			if (response.success) {
				toast.success('Blog updated successfully');
				setTimeout(() => {
					router.push('/dashboard/blogs');
				}, 1000);
			} else {
				toast.error(response.error?.message || 'Failed to update blog');
			}
		} catch (error) {
			console.error('Failed to update blog:', error);
			toast.error('An unexpected error occurred');
		} finally {
			setIsSaving(false);
		}
	};

	const handleAddMember = async () => {
		if (!isOwner) return;
		if (!newMemberUserId.trim()) return;
		try {
			const res = await blogMemberService.addMember(
				blogId,
				newMemberUserId.trim(),
			);
			if (res.success) {
				setNewMemberUserId('');
				loadMembers();
				toast.success('Member added successfully');
			} else {
				toast.error(res.error?.message || 'Failed to add member');
			}
		} catch (err) {
			console.error('Failed to add member', err);
			toast.error('An unexpected error occurred');
		}
	};

	const handleRemoveMember = async (userId: string) => {
		if (!isOwner) return;
		if (!confirm('Remove this editor from the blog?')) return;
		try {
			const res = await blogMemberService.removeMember(blogId, userId);
			if (res.success) {
				loadMembers();
				toast.success('Member removed successfully');
			} else {
				toast.error(res.error?.message || 'Failed to remove member');
			}
		} catch (err) {
			console.error('Failed to remove member', err);
			toast.error('An unexpected error occurred');
		}
	};

	if (isLoading) {
		return (
			<div className="max-w-2xl mx-auto px-4 py-8">
				<div className="text-center">Loading blog...</div>
			</div>
		);
	}

	if (!blog) {
		return (
			<div className="max-w-2xl mx-auto px-4 py-8">
				<div className="text-center">Blog not found</div>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">
				{isOwner ? 'Edit Blog' : 'Blog Details'}
			</h1>
			{!isOwner && (
				<p className="text-sm text-muted-foreground mb-4">
					You are an editor on this blog. Details are read-only.
				</p>
			)}

			<form onSubmit={handleSubmit}>
				<Card>
					<CardHeader>
						<CardTitle>Blog Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="title">Title</Label>
							<Input
								id="title"
								value={formData.title}
								onChange={(e) => handleChange('title', e.target.value)}
								placeholder="My Awesome Blog"
								disabled={!isOwner}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="domain">Domain</Label>
							<Input
								id="domain"
								value={formData.domain}
								onChange={(e) => handleChange('domain', e.target.value)}
								placeholder="myawesomeblog.com"
								disabled={!isOwner}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e) => handleChange('description', e.target.value)}
								placeholder="A brief description of your blog"
								rows={3}
								disabled={!isOwner}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="netlifySiteId">Netlify Site ID</Label>
							<Input
								id="netlifySiteId"
								value={formData.netlifySiteId}
								onChange={(e) => handleChange('netlifySiteId', e.target.value)}
								placeholder="your-site-id"
								disabled={!isOwner}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="netlifyToken">Netlify Token</Label>
							<Input
								id="netlifyToken"
								type="password"
								value={formData.netlifyToken}
								onChange={(e) => handleChange('netlifyToken', e.target.value)}
								placeholder="your-netlify-token"
								disabled={!isOwner}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="R2AccountId">R2 Account ID</Label>
							<Input
								id="R2AccountId"
								value={formData.R2AccountId}
								onChange={(e) => handleChange('R2AccountId', e.target.value)}
								placeholder="your-r2-account-id"
								disabled={!isOwner}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="R2AccessKeyId">R2 Access Key ID</Label>
							<Input
								id="R2AccessKeyId"
								value={formData.R2AccessKeyId}
								onChange={(e) => handleChange('R2AccessKeyId', e.target.value)}
								placeholder="your-r2-access-key-id"
								disabled={!isOwner}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="R2SecretAccessKey">R2 Secret Access Key</Label>
							<Input
								id="R2SecretAccessKey"
								type="password"
								value={formData.R2SecretAccessKey}
								onChange={(e) =>
									handleChange('R2SecretAccessKey', e.target.value)
								}
								placeholder="your-r2-secret-access-key"
								disabled={!isOwner}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="R2BucketName">R2 Bucket Name</Label>
							<Input
								id="R2BucketName"
								value={formData.R2BucketName}
								onChange={(e) => handleChange('R2BucketName', e.target.value)}
								placeholder="my-blog-bucket"
								disabled={!isOwner}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="R2CustomDomain">R2 Custom Domain</Label>
							<Input
								id="R2CustomDomain"
								type="url"
								value={formData.R2CustomDomain}
								onChange={(e) => handleChange('R2CustomDomain', e.target.value)}
								placeholder="https://cdn.myawesomeblog.com"
								disabled={!isOwner}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="openAIApiKey">OpenAI API Key</Label>
							<Input
								id="openAIApiKey"
								type="password"
								value={formData.openAIApiKey}
								onChange={(e) => handleChange('openAIApiKey', e.target.value)}
								placeholder="sk-..."
								disabled={!isOwner}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="isActive">Status</Label>
							<select
								id="isActive"
								value={formData.isActive.toString()}
								onChange={(e) =>
									handleChange('isActive', e.target.value === 'true')
								}
								disabled={!isOwner}
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
								<option value="true">Active</option>
								<option value="false">Inactive</option>
							</select>
						</div>
					</CardContent>
				</Card>

				<div className="flex gap-2 mt-6">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push('/dashboard/blogs')}
						disabled={isSaving}>
						Back
					</Button>
					{isOwner && (
						<Button
							type="submit"
							disabled={isSaving || !isOwner}>
							{isSaving ? 'Saving...' : 'Save Changes'}
						</Button>
					)}
				</div>
			</form>

			{isOwner && (
				// Members management (owners only)
				<Card className="mt-6">
					<CardHeader>
						<CardTitle>Members</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex gap-2">
								<Input
									placeholder="User ID to add as editor"
									value={newMemberUserId}
									onChange={(e) => setNewMemberUserId(e.target.value)}
								/>
								<Button
									onClick={handleAddMember}
									disabled={!newMemberUserId.trim()}>
									Add Editor
								</Button>
							</div>

							{loadingMembers ? (
								<div>Loading members...</div>
							) : (
								<ul className="space-y-2">
									{members.map((m) => (
										<li
											key={m.id}
											className="flex justify-between items-center">
											<div>
												<strong>{m.user.username}</strong> — {m.user.email}
												<div className="text-sm text-muted-foreground">
													{m.role}
												</div>
											</div>
											{m.role === 'OWNER' ? null : (
												<Button
													variant="destructive"
													size="sm"
													onClick={() => handleRemoveMember(m.user.id)}>
													Remove
												</Button>
											)}
										</li>
									))}
								</ul>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
