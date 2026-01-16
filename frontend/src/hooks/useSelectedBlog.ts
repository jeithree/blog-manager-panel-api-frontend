import {useState} from 'react';

const SELECTED_BLOG_KEY = 'selectedBlogId';

// Get initial value from localStorage
const getInitialBlogId = (): string => {
	if (typeof window !== 'undefined') {
		return localStorage.getItem(SELECTED_BLOG_KEY) || '';
	}
	return '';
};

export function useSelectedBlog() {
	const [selectedBlogId, setSelectedBlogIdState] =
		useState<string>(getInitialBlogId);

	// Save to localStorage whenever it changes
	const setSelectedBlogId = (blogId: string) => {
		setSelectedBlogIdState(blogId);
		if (typeof window !== 'undefined') {
			if (blogId) {
				localStorage.setItem(SELECTED_BLOG_KEY, blogId);
			} else {
				localStorage.removeItem(SELECTED_BLOG_KEY);
			}
		}
	};

	return {selectedBlogId, setSelectedBlogId};
}
