import { Router } from 'express';
import { CommentController } from '@/controllers/comment.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { createCommentSchema, updateCommentSchema } from '@/schemas/comment.schema';

const router = Router();

// Get comments for a post (public)
router.get('/posts/:postId/comments', CommentController.getComments);

// Create comment (authenticated)
router.post(
  '/posts/:postId/comments',
  authenticate,
  validate(createCommentSchema),
  CommentController.createComment
);

// Update comment (authenticated)
router.patch(
  '/comments/:commentId',
  authenticate,
  validate(updateCommentSchema),
  CommentController.updateComment
);

// Delete comment (authenticated)
router.delete('/comments/:commentId', authenticate, CommentController.deleteComment);

// Accept comment as answer (authenticated, post author only)
router.post('/comments/:commentId/accept', authenticate, CommentController.acceptComment);

export default router;


