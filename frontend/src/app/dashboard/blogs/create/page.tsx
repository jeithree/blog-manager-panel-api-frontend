'use client';

import React, {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {blogService} from '@/services/blog';

export default function CreateBlogPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const [formData, setFormData] = useState({
		title: '',
		domain: '',
		description: '',
		netlifySiteId: '',
		R2BucketName: '',
		R2CustomDomain: '',
	});

	const handleChange = (field: string, value: string) => {
		setFormData((prev) => ({...prev, [field]: value}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const response = await blogService.createBlog(formData);

			if (response.success) {
				router.push('/dashboard/blogs');
			}
		} catch (error) {
			console.error('Failed to create blog:', error);
			alert('Failed to create blog. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Create New Blog</h1>

			<form onSubmit={handleSubmit}>
				<Card>
					<CardHeader>
						<CardTitle>Blog Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="title">Title *</Label>
							<Input
								id="title"
								value={formData.title}
								onChange={(e) => handleChange('title', e.target.value)}
								required
								placeholder="My Awesome Blog"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="domain">Domain *</Label>
							<Input
								id="domain"
								value={formData.domain}
								onChange={(e) => handleChange('domain', e.target.value)}
								required
								placeholder="myawesomeblog.com"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Description *</Label>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e) => handleChange('description', e.target.value)}
								required
								placeholder="A brief description of your blog"
								rows={3}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="netlifySiteId">Netlify Site ID *</Label>
							<Input
								id="netlifySiteId"
								value={formData.netlifySiteId}
								onChange={(e) => handleChange('netlifySiteId', e.target.value)}
								required
								placeholder="your-site-id"
							/>
							<p className="text-xs text-muted-foreground">
								Find this in your Netlify site settings
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="R2BucketName">R2 Bucket Name *</Label>
							<Input
								id="R2BucketName"
								value={formData.R2BucketName}
								onChange={(e) => handleChange('R2BucketName', e.target.value)}
								required
								placeholder="my-blog-bucket"
							/>
							<p className="text-xs text-muted-foreground">
								Cloudflare R2 bucket for storing media files
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="R2CustomDomain">R2 Custom Domain *</Label>
							<Input
								id="R2CustomDomain"
								type="url"
								value={formData.R2CustomDomain}
								onChange={(e) => handleChange('R2CustomDomain', e.target.value)}
								required
								placeholder="https://cdn.myawesomeblog.com"
							/>
							<p className="text-xs text-muted-foreground">
								Custom domain for your R2 bucket
							</p>
						</div>
					</CardContent>
				</Card>

				<div className="flex gap-2 mt-6">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push('/dashboard/blogs')}
						disabled={isLoading}>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={isLoading}>
						{isLoading ? 'Creating...' : 'Create Blog'}
					</Button>
				</div>
			</form>
		</div>
	);
}
