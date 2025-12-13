import { Router } from 'express';
import { PostController } from '@/controllers/post.controller';
import { authenticate, optionalAuth } from '@/middleware/auth.middleware';
import { validate, validateQuery } from '@/middleware/validate.middleware';
import { createPostSchema, updatePostSchema, getPostsQuerySchema } from '@/schemas/post.schema';

const router = Router();

// Public routes (with optional auth for userVote)
router.get('/', optionalAuth, validateQuery(getPostsQuerySchema), PostController.getPosts);

router.get('/:slug', optionalAuth, PostController.getPostBySlug);

// Protected routes
router.post('/', authenticate, validate(createPostSchema), PostController.createPost);

router.patch('/:id', authenticate, validate(updatePostSchema), PostController.updatePost);

router.delete('/:id', authenticate, PostController.deletePost);

export default router;

