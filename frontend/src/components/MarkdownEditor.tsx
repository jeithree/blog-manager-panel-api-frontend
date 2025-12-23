'use client';

import React, {useState} from 'react';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Textarea} from '@/components/ui/textarea';

interface MarkdownEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	minHeight?: string;
}

export function MarkdownEditor({
	value,
	onChange,
	placeholder = 'Enter markdown content...',
	minHeight = '400px',
}: MarkdownEditorProps) {
	const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

	// Simple markdown to HTML converter for preview
	const markdownToHtml = (markdown: string): string => {
		const lines = markdown.split('\n');
		const htmlLines: string[] = [];
		let inCodeBlock = false;
		let inList = false;
		let listType: 'ul' | 'ol' | null = null;
		let lastListItemIndex: number | null = null;
		let codeBlockContent: string[] = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			// Handle code blocks
			if (line.trim().startsWith('```')) {
				if (inCodeBlock) {
					htmlLines.push(
						`<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-6"><code>${codeBlockContent.join(
							'\n'
						)}</code></pre>`
					);
					codeBlockContent = [];
					inCodeBlock = false;
				} else {
					if (inList) {
						htmlLines.push(`</${listType}>`);
						inList = false;
						listType = null;
						lastListItemIndex = null;
					}
					inCodeBlock = true;
				}
				continue;
			}

			if (inCodeBlock) {
				codeBlockContent.push(line);
				continue;
			}

			// Headers - close list if open
			if (line.match(/^# /)) {
				if (inList) {
					htmlLines.push(`</${listType}>`);
					inList = false;
					listType = null;
					lastListItemIndex = null;
				}
				htmlLines.push(
					`<h1 class="text-4xl font-bold text-gray-900 mt-8 mb-4 leading-tight">${line.substring(
						2
					)}</h1>`
				);
			} else if (line.match(/^## /)) {
				if (inList) {
					htmlLines.push(`</${listType}>`);
					inList = false;
					listType = null;
					lastListItemIndex = null;
				}
				htmlLines.push(
					`<h2 class="text-3xl font-bold text-gray-900 mt-8 mb-4 leading-tight">${line.substring(
						3
					)}</h2>`
				);
			} else if (line.match(/^### /)) {
				if (inList) {
					htmlLines.push(`</${listType}>`);
					inList = false;
					listType = null;
					lastListItemIndex = null;
				}
				htmlLines.push(
					`<h3 class="text-2xl font-bold text-gray-900 mt-6 mb-3 leading-tight">${line.substring(
						4
					)}</h3>`
				);
			}
			// Unordered lists
			else if (line.match(/^[-*] /)) {
				if (!inList) {
					htmlLines.push(
						'<ul class="list-disc pl-6 space-y-2 my-6 text-gray-700">'
					);
					inList = true;
					listType = 'ul';
				}
				const content = line.substring(2);
				htmlLines.push(
					`<li class="leading-relaxed">${processInlineMarkdown(content)}</li>`
				);
				lastListItemIndex = htmlLines.length - 1;
			}
			// Ordered lists
			else if (line.match(/^\d+\. /)) {
				if (!inList) {
					htmlLines.push(
						'<ol class="list-decimal pl-6 space-y-2 my-6 text-gray-700">'
					);
					inList = true;
					listType = 'ol';
				}
				const content = line.substring(line.indexOf('. ') + 2);
				htmlLines.push(
					`<li class="leading-relaxed">${processInlineMarkdown(content)}</li>`
				);
				lastListItemIndex = htmlLines.length - 1;
			}
			// Nested list items (indented - or *) -> append as nested ul inside last li
			else if (
				line.match(/^\s+[-*]\s+/) &&
				inList &&
				lastListItemIndex !== null
			) {
				const nestedContent = line.trim().substring(2);
				// insert nested ul before closing </li>
				const prev = htmlLines[lastListItemIndex];
				const insertPos = prev.lastIndexOf('</li>');
				if (insertPos !== -1) {
					const before = prev.substring(0, insertPos);
					const after = prev.substring(insertPos);
					const nested = `<ul class="list-disc pl-6 my-2"><li class="leading-relaxed">${processInlineMarkdown(
						nestedContent
					)}</li></ul>`;
					htmlLines[lastListItemIndex] = before + nested + after;
				} else {
					// fallback: push nested as separate block
					htmlLines.push(
						`<ul class="list-disc pl-6 my-2"><li class="leading-relaxed">${processInlineMarkdown(
							nestedContent
						)}</li></ul>`
					);
				}
			}
			// Continuation lines (indented) are appended to previous list item
			else if (/^\s{2,}\S/.test(line) && inList && lastListItemIndex !== null) {
				const cont = line.trim();
				const prev = htmlLines[lastListItemIndex];
				const insertPos = prev.lastIndexOf('</li>');
				if (insertPos !== -1) {
					const before = prev.substring(0, insertPos);
					const after = prev.substring(insertPos);
					const addition = `<div class="mt-2 text-muted-foreground">${processInlineMarkdown(
						cont
					)}</div>`;
					htmlLines[lastListItemIndex] = before + addition + after;
				} else {
					htmlLines[lastListItemIndex] =
						prev + `<div>${processInlineMarkdown(cont)}</div>`;
				}
			}
			// Blank lines: close list only if next non-empty line is not a list item or continuation
			else if (line.trim() === '') {
				if (inList) {
					// lookahead to find next non-empty line
					let j = i + 1;
					while (j < lines.length && lines[j].trim() === '') j++;
					const next = j < lines.length ? lines[j] : null;
					const nextIsListItem =
						next &&
						(next.match(/^\d+\. /) ||
							next.match(/^[-*] /) ||
							next.match(/^\s+[-*]\s+/) ||
							/^\s{2,}\S/.test(next));
					if (!nextIsListItem) {
						htmlLines.push(`</${listType}>`);
						inList = false;
						listType = null;
						lastListItemIndex = null;
					}
				}
				// Don't add extra spacing
			}
			// Regular paragraphs
			else if (line.trim() !== '') {
				if (inList) {
					htmlLines.push(`</${listType}>`);
					inList = false;
					listType = null;
				}
				htmlLines.push(
					`<p class="text-gray-700 leading-relaxed my-6">${processInlineMarkdown(
						line
					)}</p>`
				);
			}
		}

		// Close any open lists
		if (inList) {
			htmlLines.push(`</${listType}>`);
		}

		return htmlLines.join('\n');
	};

	const processInlineMarkdown = (text: string): string => {
		let result = text;

		// Bold
		result = result.replace(
			/\*\*(.*?)\*\*/g,
			'<strong class="font-bold">$1</strong>'
		);

		// Italic
		result = result.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

		// Inline code
		result = result.replace(
			/`([^`]+)`/g,
			'<code class="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
		);

		// Links
		result = result.replace(
			/\[([^\]]+)\]\(([^)]+)\)/g,
			'<a href="$2" class="text-blue-600 hover:text-blue-800 underline">$1</a>'
		);

		// Images
		result = result.replace(
			/!\[([^\]]*)\]\(([^)]+)\)/g,
			'<img src="$2" alt="$1" class="rounded-lg my-6 w-full" />'
		);

		return result;
	};

	return (
		<div className="w-full">
			<Tabs
				value={activeTab}
				onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="edit">Edit (Markdown)</TabsTrigger>
					<TabsTrigger value="preview">Preview</TabsTrigger>
				</TabsList>

				<TabsContent value="edit">
					<Textarea
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder={placeholder}
						className="font-mono"
						style={{minHeight}}
					/>
					<div className="mt-2 text-xs text-muted-foreground">
						Supports Markdown: # headers, **bold**, *italic*, [links](url),
						`code`, etc.
					</div>
				</TabsContent>

				<TabsContent value="preview">
					<div
						className="border rounded-md bg-white overflow-auto"
						style={{minHeight}}>
						<div className="max-w-4xl mx-auto px-4 py-12">
							{value ? (
								<div
									dangerouslySetInnerHTML={{__html: markdownToHtml(value)}}
								/>
							) : (
								<p className="text-gray-500">Nothing to preview yet...</p>
							)}
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
