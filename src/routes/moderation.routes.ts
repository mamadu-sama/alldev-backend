import { Router } from 'express';
import { ModerationController } from '@/controllers/moderation.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/role.middleware';
import { validate } from '@/middleware/validate.middleware';
import { hidePostSchema, lockPostSchema } from '@/schemas/moderation.schema';

const router = Router();

// All routes require moderator or admin role
const moderatorAuth = [authenticate, requireRole(['MODERATOR', 'ADMIN'])];

// Hide/unhide post
router.post('/moderator/posts/:postId/hide', ...moderatorAuth, validate(hidePostSchema), ModerationController.hidePost);
router.post('/moderator/posts/:postId/unhide', ...moderatorAuth, ModerationController.unhidePost);

// Lock/unlock post
router.post('/moderator/posts/:postId/lock', ...moderatorAuth, validate(lockPostSchema), ModerationController.lockPost);
router.post('/moderator/posts/:postId/unlock', ...moderatorAuth, ModerationController.unlockPost);

// Hide/unhide comment
router.post('/moderator/comments/:commentId/hide', ...moderatorAuth, validate(hidePostSchema), ModerationController.hideComment);
router.post('/moderator/comments/:commentId/unhide', ...moderatorAuth, ModerationController.unhideComment);

// Get moderation actions log
router.get('/moderator/actions', ...moderatorAuth, ModerationController.getModerationActions);

export default router;


