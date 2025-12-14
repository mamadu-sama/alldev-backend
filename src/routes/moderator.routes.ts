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

export default router;

