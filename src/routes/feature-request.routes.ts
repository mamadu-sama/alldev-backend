import { Router } from 'express';
import { FeatureRequestController } from '@/controllers/feature-request.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/role.middleware';
import { validate } from '@/middleware/validate.middleware';
import {
  createFeatureRequestSchema,
  updateFeatureRequestStatusSchema,
  createFeatureCommentSchema,
} from '@/schemas/feature-request.schema';
import { Role } from '@prisma/client';

const router = Router();

// Public routes (with optional auth for vote status)
router.get('/feature-requests', FeatureRequestController.getAll);
router.get('/feature-requests/stats', FeatureRequestController.getStats);
router.get('/feature-requests/:id', FeatureRequestController.getById);

// Authenticated routes
router.post(
  '/feature-requests',
  authenticate,
  validate(createFeatureRequestSchema),
  FeatureRequestController.create
);

router.post('/feature-requests/:id/vote', authenticate, FeatureRequestController.toggleVote);

router.post(
  '/feature-requests/:id/comments',
  authenticate,
  validate(createFeatureCommentSchema),
  FeatureRequestController.addComment
);

// Admin/Moderator only
router.patch(
  '/feature-requests/:id/status',
  authenticate,
  requireRole(Role.ADMIN, Role.MODERATOR),
  validate(updateFeatureRequestStatusSchema),
  FeatureRequestController.updateStatus
);

export default router;

