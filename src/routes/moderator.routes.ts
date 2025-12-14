import { Router } from 'express';
import { ModeratorController } from '@/controllers/moderator.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requireModerator } from '@/middleware/role.middleware';
import { validate } from '@/middleware/validate.middleware';
import { takeActionSchema } from '@/schemas/moderator.schema';

const router = Router();

// All routes require moderator or admin role
const moderatorAuth = [authenticate, requireModerator];

// Dashboard
router.get('/moderator/dashboard/stats', ...moderatorAuth, ModeratorController.getDashboardStats);
router.get('/moderator/queue/recent', ...moderatorAuth, ModeratorController.getRecentQueueItems);

// Queue Management
router.get('/moderator/queue/stats', ...moderatorAuth, ModeratorController.getQueueStats);
router.get('/moderator/queue', ...moderatorAuth, ModeratorController.getQueue);

// Actions
router.post(
  '/moderator/actions',
  ...moderatorAuth,
  validate(takeActionSchema),
  ModeratorController.takeAction
);

// Reported Posts and Comments
router.get('/moderator/posts/reported', ...moderatorAuth, ModeratorController.getReportedPosts);
router.get('/moderator/comments/reported', ...moderatorAuth, ModeratorController.getReportedComments);

// Reports Management
router.get('/moderator/reports', ...moderatorAuth, ModeratorController.getReports);
router.post('/moderator/reports/:id/resolve', ...moderatorAuth, ModeratorController.resolveReport);

// History
router.get('/moderator/history', ...moderatorAuth, ModeratorController.getHistory);

export default router;

