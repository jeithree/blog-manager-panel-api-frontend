import {Router} from 'express';
import {validateBody} from '../middlewares/validation.ts';
import {isAuthenticated} from '../middlewares/auth.ts';
import {createBlogSchema, updateBlogSchema} from '../types/blog.ts';
import * as blogController from '../controllers/blogController.ts';
import * as blogMemberController from '../controllers/blogMemberController.ts';
import {addBlogMemberSchema} from '../types/blogMember.ts';

const router = Router();

router.get('/', isAuthenticated, blogController.getBlogs);

router.get('/:blogId', isAuthenticated, blogController.getBlog);

router.patch(
	'/:blogId',
	isAuthenticated,
	validateBody(updateBlogSchema),
	blogController.updateBlog
);

router.post(
	'/',
	isAuthenticated,
	validateBody(createBlogSchema),
	blogController.createBlog
);

// Members management (owners only)
router.get(
	'/:blogId/members',
	isAuthenticated,
	blogMemberController.listMembers
);
router.post(
	'/:blogId/members',
	isAuthenticated,
	validateBody(addBlogMemberSchema),
	blogMemberController.addMember
);
router.delete(
	'/:blogId/members/:userId',
	isAuthenticated,
	blogMemberController.removeMember
);

export default router;
