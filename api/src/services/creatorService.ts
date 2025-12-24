import fs from 'node:fs/promises';
import prisma from '../prisma.ts';
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
		| 'title-suggestions'
		| 'post-creation'
		| 'image-prompt-creation'
		| 'post-edit'
) => {
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
		where: {id: blogId, userId: userId},
		include: {
			categories: true,
			posts: {select: {title: true, category: true}},
		},
	});

	if (!blog) {
		throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
	}

	const categoriesList = blog.categories
		.map((cat) => `- ${cat.name}: ${cat.description}`)
		.join('\n');

	const categoriesNamesList = blog.categories.map((cat) => cat.name).join(', ');

	const existingPostsList = blog.posts
		.map((post) => `- ${post.title} | Category: ${post.category.name}`)
		.join('\n');

	// Prepare prompt
	let promptTemplate = await getPromptTemplate('title-suggestions');
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

	console.log('Prompt Template:\n', promptTemplate);

	// Call OpenAI API - wrap list in root object so JSON Schema root is an object
	const TitleSuggestionsSchema = z.object({
		suggestions: z.array(
			z.object({
				category: z.string(),
				titles: z.array(z.string()),
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

	const titleSuggestions = parsed.suggestions.map((item) => ({
		...item,
		categoryId: categoryNameToId.get(item.category.toLowerCase()) ?? null,
	}));

	return titleSuggestions;

	// return {
	//     success: true,
	// }
};

export const generatePostContent = async (
	userId: string,
	data: GeneratePostContentDto
) => {
	const {blogId, categoryId, title} = data;

	if (!blogId) {
		throw new NotFoundError('Blog ID is required', 'BLOG_ID_REQUIRED');
	}

	const blog = await prisma.blog.findUnique({
		where: {id: blogId, userId: userId},
		include: {
			categories: true,
			tags: true,
			posts: {select: {title: true, category: true, slug: true}},
		},
	});

	if (!blog) {
		throw new NotFoundError('Blog not found', 'BLOG_NOT_FOUND');
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
	let promptTemplate = await getPromptTemplate('post-creation');
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

	console.log('Prompt Template:\n', promptTemplate);

	// Call OpenAI API
	const PostContentSchema = z.object({
		content: z.string(),
		description: z.string(),
		tags: z.array(z.string()),
		slug: z.string(),
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
		slug: parsed.slug,
		content: parsed.content,
		categoryId: categoryId,
		tagNames: parsed.tags,
	};

	return post;
	// return {
	//     success: true,
	// }
};

export const generateImagePrompt = async (blogPost: string) => {
	// Prepare prompt
	let promptTemplate = await getPromptTemplate('image-prompt-creation');
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

	// return {
	//     success: true,
	// }
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

	if (!post || post.blog.userId !== userId) {
		throw new NotFoundError('Post not found', 'POST_NOT_FOUND');
	}

	let promptTemplate = await getPromptTemplate('post-edit');

	promptTemplate = replacePlaceholder(
		promptTemplate,
		'{{CURRENT_POST_CONTENT}}',
		post.content ?? ''
	);
	promptTemplate = replacePlaceholder(
		promptTemplate,
		'{{CHANGE_REQUEST}}',
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
