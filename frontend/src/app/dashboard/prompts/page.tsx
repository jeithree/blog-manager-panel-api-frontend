'use client';

import {useState, useEffect, useCallback} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import {Textarea} from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {blogService, type Blog} from '@/services/blog';
import {promptService, type Prompt} from '@/services/prompt';

export default function PromptsPage() {
	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [blogId, setBlogId] = useState('');
	const [prompts, setPrompts] = useState<Prompt[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const [showDialog, setShowDialog] = useState(false);
	const [editing, setEditing] = useState<Prompt | null>(null);
	const [name, setName] = useState('');
	const [content, setContent] = useState('');
	const [isSaving, setIsSaving] = useState(false);

	const loadBlogs = useCallback(async () => {
		try {
			const res = await blogService.getBlogs();
			if (res.success && res.data) {
				setBlogs(res.data);
				if (res.data.length > 0 && !blogId) setBlogId(res.data[0].id);
			}
		} catch (e) {
			console.error(e);
		}
	}, [blogId]);

	const loadPrompts = useCallback(async () => {
		if (!blogId) return;
		setIsLoading(true);
		try {
			const res = await promptService.getPrompts({blogId});
			if (res.success && res.data) setPrompts(res.data);
		} catch (e) {
			console.error(e);
		} finally {
			setIsLoading(false);
		}
	}, [blogId]);

	useEffect(() => {
		loadBlogs();
	}, [loadBlogs]);
	useEffect(() => {
		if (blogId) loadPrompts();
	}, [blogId, loadPrompts]);

	const openCreate = () => {
		setEditing(null);
		setName('');
		setContent('');
		setShowDialog(true);
	};
	const openEdit = (p: Prompt) => {
		setEditing(p);
		setName(p.name);
		setContent(p.content);
		setShowDialog(true);
	};

	const handleSave = async () => {
		if (!blogId) return;
		setIsSaving(true);
		try {
			if (editing) {
				const res = await promptService.updatePrompt(editing.id, {
					name,
					content,
				});
				if (res.success && res.data) {
					setPrompts((prev) =>
						prev.map((x) => (x.id === res.data!.id ? res.data! : x))
					);
					setShowDialog(false);
				}
			} else {
				const res = await promptService.createPrompt({name, content, blogId});
				if (res.success && res.data) {
					setPrompts((prev) => [...prev, res.data!]);
					setShowDialog(false);
				}
			}
		} catch (e) {
			console.error(e);
			alert('Failed to save prompt');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Prompts</h1>

			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Blog Selection</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Label>Select Blog</Label>
						<Select
							value={blogId}
							onValueChange={setBlogId}>
							<SelectTrigger>
								<SelectValue placeholder="Select a blog" />
							</SelectTrigger>
							<SelectContent>
								{blogs.map((b) => (
									<SelectItem
										key={b.id}
										value={b.id}>
										{b.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			<div className="mb-4 flex justify-end">
				<Button
					onClick={openCreate}
					disabled={!blogId}>
					Add Prompt
				</Button>
			</div>

			<div className="grid gap-3">
				{isLoading ? (
					<p>Loading...</p>
				) : prompts.length === 0 ? (
					<p className="text-sm text-muted-foreground">No prompts yet</p>
				) : (
					prompts.map((p) => (
						<Card
							key={p.id}
							className="p-3">
							<div className="flex justify-between items-start">
								<div>
									<h3 className="font-medium">{p.name}</h3>
									<p className="text-sm text-muted-foreground">{p.content}</p>
								</div>
								<div>
									<Button
										size="sm"
										variant="outline"
										onClick={() => openEdit(p)}>
										Edit
									</Button>
								</div>
							</div>
						</Card>
					))
				)}
			</div>

			<Dialog
				open={showDialog}
				onOpenChange={setShowDialog}>
				<DialogContent className="max-h-[80vh] overflow-auto">
					<DialogHeader>
						<DialogTitle>
							{editing ? 'Edit Prompt' : 'Create Prompt'}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Name</Label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Content</Label>
							<Textarea
								className="max-h-96 overflow-auto"
								value={content}
								onChange={(e) => setContent(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowDialog(false)}>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							disabled={isSaving || !name || !content}>
							{isSaving ? 'Saving...' : 'Save'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
