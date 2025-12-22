'use client';

import React, {useState, useEffect} from 'react';
import {useRouter, useParams} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {blogService, type Blog} from '@/services/blog';

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
		R2BucketName: '',
		R2CustomDomain: '',
	});

	useEffect(() => {
		loadBlog();
	}, [blogId]);

	const loadBlog = async () => {
		setIsLoading(true);
		try {
			const response = await blogService.getBlog(blogId);

			if (response.success && response.data) {
				const blogData = response.data;
				setBlog(blogData);
				setFormData({
					title: blogData.title,
					domain: blogData.domain,
					description: blogData.description,
					netlifySiteId: blogData.netlifySiteId,
					R2BucketName: blogData.R2BucketName,
					R2CustomDomain: blogData.R2CustomDomain,
				});
			}
		} catch (error) {
			console.error('Failed to load blog:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleChange = (field: string, value: string) => {
		setFormData((prev) => ({...prev, [field]: value}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);

		try {
			const response = await blogService.updateBlog(blogId, formData);

			if (response.success) {
				router.push('/dashboard/blogs');
			}
		} catch (error) {
			console.error('Failed to update blog:', error);
			alert('Failed to update blog. Please try again.');
		} finally {
			setIsSaving(false);
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
			<h1 className="text-3xl font-bold mb-6">Edit Blog</h1>

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
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="domain">Domain</Label>
							<Input
								id="domain"
								value={formData.domain}
								onChange={(e) => handleChange('domain', e.target.value)}
								placeholder="myawesomeblog.com"
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
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="netlifySiteId">Netlify Site ID</Label>
							<Input
								id="netlifySiteId"
								value={formData.netlifySiteId}
								onChange={(e) => handleChange('netlifySiteId', e.target.value)}
								placeholder="your-site-id"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="R2BucketName">R2 Bucket Name</Label>
							<Input
								id="R2BucketName"
								value={formData.R2BucketName}
								onChange={(e) => handleChange('R2BucketName', e.target.value)}
								placeholder="my-blog-bucket"
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
							/>
						</div>
					</CardContent>
				</Card>

				<div className="flex gap-2 mt-6">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push('/dashboard/blogs')}
						disabled={isSaving}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isSaving}>
						{isSaving ? 'Saving...' : 'Save Changes'}
					</Button>
				</div>
			</form>
		</div>
	);
}
