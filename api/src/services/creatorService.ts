import prisma from '../prisma.ts';
import fs from 'node:fs/promises';
import OpenAI from 'openai';
import {zodTextFormat} from 'openai/helpers/zod';
import {z} from 'zod';
import type {
	GeneratePostContentDto,
	GeneratePostEditDto,
} from '../types/creator.ts';
import {NotFoundError} from '../lib/appError.ts';

const getPromptTemplate = async (
	type:
		| 'content-to-avoid'
		| 'title-suggestions'
		| 'post-creation'
		| 'image-prompt-creation'
		| 'post-edit',
	blogId: string
) => {
	// Only image prompt is stored in DB. Other templates remain on disk.
	// This is because image prompt may be customized per blog.
	if (type === 'image-prompt-creation') {
		const prompt = await prisma.prompt.findFirst({
			where: {name: type, blogId},
		});
		if (prompt) return prompt.content;

		throw new NotFoundError(
			'Prompt template not found',
			'PROMPT_TEMPLATE_NOT_FOUND'
		);
	}

	if (type === 'content-to-avoid') {
		const prompt = await prisma.prompt.findFirst({
			where: {name: type, blogId},
		});
		if (prompt) return prompt.content;
		return '';
	}

	// For other prompt types, read the file from the prompts folder
	// Casue they are generic templates
	const filePath = `./src/prompts/${type}.txt`;
	const template = await fs.readFile(filePath, 'utf-8');
	return template;
};

const replacePlaceholder = (
	template: string,
	placeholder: string,
	value: string
) => {
	return template.replace(placeholder, value);
};

export const generateTitleSuggestions = async (
	userId: string,
	blogId: string
) => {
	if (!blogId) {
		throw new NotFoundError('Blog ID is required', 'BLOG_ID_REQUIRED');
	}

	// Fetch blog categories and existing post titles
	const blog = await prisma.blog.findUnique({
		where: {id: blogId},
		include: {
			categories: true,
			posts: {select: {title: true, slug: true, category: true}},
		},
	});

	if (!blog) {
		throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
	}

	// Check if user is owner or member
	const isOwner = blog.userId === userId;
	if (!isOwner) {
		const member = await prisma.blogMember.findUnique({
			where: {blogId_userId: {blogId, userId}},
		});
		if (!member) {
			throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
		}
	}

	const categoriesList = blog.categories
		.map((cat) => `- ${cat.name}: ${cat.description}`)
		.join('\n');

	const categoriesNamesList = blog.categories.map((cat) => cat.name).join(', ');

	const existingPostsList = blog.posts
		.map(
			(post) =>
				`- ${post.title} | Category: ${post.category.name} | Slug: ${post.slug}`
		)
		.join('\n');

	// Prepare prompt
	let promptTemplate = await getPromptTemplate('title-suggestions', blogId);
	promptTemplate = replacePlaceholder(
		promptTemplate,
		'{{CATEGORIES LIST PLACEHOLDER}}',
		categoriesNamesList
	);
	promptTemplate = replacePlaceholder(
		promptTemplate,
		'{{CATEGORIES PLACEHOLDER}}',
		categoriesList
	);
	promptTemplate = replacePlaceholder(
		promptTemplate,
		'{{POSTS PLACEHOLDER}}',
		existingPostsList || 'No existing posts.'
	);

	let contentToAvoid = await getPromptTemplate('content-to-avoid', blogId);
	promptTemplate = replacePlaceholder(
		promptTemplate,
		'{{CONTENT TO AVOID PLACEHOLDER}}',
		contentToAvoid || 'No specific content to avoid.'
	);

	console.log('Prompt Template:\n', promptTemplate);

	// Call OpenAI API - wrap list in root object so JSON Schema root is an object
	// Titles now include both title and slug from the model; accept that shape
	const TitleSuggestionsSchema = z.object({
		suggestions: z.array(
			z.object({
				category: z.string(),
				titles: z.array(
					z.object({
						title: z.string(),
						slug: z.string(),
					})
				),
			})
		),
	});

	const client = new OpenAI();
	const response = await client.responses.parse({
		model: 'gpt-5-mini',
		input: [{role: 'user', content: promptTemplate}],
		store: false,
		text: {format: zodTextFormat(TitleSuggestionsSchema, 'title_suggestions')},
	});

	console.log('OpenAI Response:\n', response);

	const parsed = TitleSuggestionsSchema.parse(JSON.parse(response.output_text));

	const categoryNameToId = new Map(
		blog.categories.map((cat) => [cat.name.toLowerCase(), cat.id])
	);

	// Return titles as objects containing title+slug so frontend can use generated slugs
	const titleSuggestions = parsed.suggestions.map((item) => ({
		category: item.category,
		titles: item.titles.map((t) => ({title: t.title, slug: t.slug})),
		categoryId: categoryNameToId.get(item.category.toLowerCase()) ?? null,
	}));

	return titleSuggestions;
};

export const generatePostContent = async (
	userId: string,
	data: GeneratePostContentDto
) => {
	const {blogId, categoryId, title, slug} = data;

	if (!blogId) {
		throw new NotFoundError('Blog ID is required', 'BLOG_ID_REQUIRED');
	}

	const blog = await prisma.blog.findUnique({
		where: {id: blogId},
		include: {
			categories: true,
			tags: true,
			posts: {select: {title: true, slug: true, category: true}},
		},
	});

	if (!blog) {
		throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
	}

	// Check if user is owner or member
	const isOwner = blog.userId === userId;
	if (!isOwner) {
		const member = await prisma.blogMember.findUnique({
			where: {blogId_userId: {blogId, userId}},
		});
		if (!member) {
			throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
		}
	}

	const category = blog.categories.find((cat) => cat.id === categoryId);

	if (!category) {
		throw new NotFoundError(
			'Category not found in this blog',
			'CATEGORY_NOT_FOUND'
		);
	}

	const categoriesNamesList = blog.categories.map((cat) => cat.name).join(', ');
	const tagsList = blog.tags.map((tag) => tag.name).join(', ');
	const existingPostsList = blog.posts
		.map(
			(post) =>
				`- ${post.title} | Category: ${post.category.name} | Slug: /blog/${post.slug}`
		)
		.join('\n');

	// Prepare prompt
	let promptTemplate = await getPromptTemplate('post-creation', blogId);
	promptTemplate = replacePlaceholder(
		promptTemplate,
		'{{CATEGORIES LIST PLACEHOLDER}}',
		categoriesNamesList
	);
	promptTemplate = replacePlaceholder(
		promptTemplate,
		'{{POST TITLE PLACEHOLDER}}',
		title
	);
	promptTemplate = replacePlaceholder(
		promptTemplate,
		'{{CATEGORY PLACEHOLDER}}',
		category.name
	);
	promptTemplate = replacePlaceholder(
		promptTemplate,
		'{{TAGS PLACEHOLDER}}',
		tagsList || 'No tags available.'
	);
	promptTemplate = replacePlaceholder(
		promptTemplate,
		'{{POSTS PLACEHOLDER}}',
		existingPostsList || 'No existing posts.'
	);

	let contentToAvoid = await getPromptTemplate('content-to-avoid', blogId);
	promptTemplate = replacePlaceholder(
		promptTemplate,
		'{{CONTENT TO AVOID PLACEHOLDER}}',
		contentToAvoid || 'No specific content to avoid.'
	);

	console.log('Prompt Template:\n', promptTemplate);

	// Call OpenAI API
	const PostContentSchema = z.object({
		content: z.string(),
		description: z.string(),
		tags: z.array(z.string()),
	});

	const client = new OpenAI();
	const response = await client.responses.parse({
		model: 'gpt-5-mini',
		input: [{role: 'user', content: promptTemplate}],
		store: false,
		text: {format: zodTextFormat(PostContentSchema, 'post_content')},
	});

	console.log('OpenAI Response:\n', response);

	const parsed = PostContentSchema.parse(JSON.parse(response.output_text));

	const post = {
		blogId: blogId,
		title: title,
		description: parsed.description,
		slug: slug,
		content: parsed.content,
		categoryId: categoryId,
		tagNames: parsed.tags,
	};

	return post;
};

export const generateImagePrompt = async (blogPost: string, blogId: string) => {
	let promptTemplate = await getPromptTemplate('image-prompt-creation', blogId);
	promptTemplate = replacePlaceholder(
		promptTemplate,
		'[BLOG POST PLACEHOLDER]',
		blogPost
	);

	console.log('Prompt Template:\n', promptTemplate);

	// Call OpenAI API
	const ImagePromptSchema = z.object({
		prompt: z.string(),
	});

	const client = new OpenAI();
	const response = await client.responses.parse({
		model: 'gpt-5-mini',
		input: [{role: 'user', content: promptTemplate}],
		store: false,
		text: {format: zodTextFormat(ImagePromptSchema, 'image_prompt')},
	});

	console.log('OpenAI Response:\n', response);

	const parsed = ImagePromptSchema.parse(JSON.parse(response.output_text));
	return parsed.prompt;
};

export const generatePostEdit = async (
	userId: string,
	data: GeneratePostEditDto
) => {
	const {blogId, postId, changeRequest} = data;

	if (!blogId) {
		throw new NotFoundError('Blog ID is required', 'BLOG_ID_REQUIRED');
	}

	const post = await prisma.post.findFirst({
		where: {id: postId, blogId},
		include: {
			category: true,
			tags: true,
			blog: {select: {id: true, userId: true, title: true}},
		},
	});

	if (!post) {
		throw new NotFoundError('Post not found', 'POST_NOT_FOUND');
	}

	// Check if user is owner or member
	const isOwner = post.blog.userId === userId;
	if (!isOwner) {
		const member = await prisma.blogMember.findUnique({
			where: {blogId_userId: {blogId, userId}},
		});
		if (!member) {
			throw new NotFoundError('Post not found', 'POST_NOT_FOUND');
		}
	}

	let promptTemplate = await getPromptTemplate('post-edit', post.blogId);

	promptTemplate = replacePlaceholder(
		promptTemplate,
		'{{CURRENT_POST_CONTENT_PLACEHOLDER}}',
		post.content ?? ''
	);
	promptTemplate = replacePlaceholder(
		promptTemplate,
		'{{CHANGE_REQUEST_PLACEHOLDER}}',
		changeRequest
	);

	console.log('Prompt Template:\n', promptTemplate);

	const PostEditSchema = z.object({
		content: z.string(),
	});

	const client = new OpenAI();
	const response = await client.responses.parse({
		model: 'gpt-5-mini',
		input: [{role: 'user', content: promptTemplate}],
		store: false,
		text: {format: zodTextFormat(PostEditSchema, 'post_edit')},
	});

	console.log('OpenAI Response:\n', response);

	const parsed = PostEditSchema.parse(JSON.parse(response.output_text));

	return {
		postId,
		blogId,
		...parsed,
	};
};
