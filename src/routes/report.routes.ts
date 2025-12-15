import { Router } from 'express';
import { ReportController } from '@/controllers/report.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requireModerator } from '@/middleware/role.middleware';
import { validate } from '@/middleware/validate.middleware';
import { createReportSchema, updateReportStatusSchema } from '@/schemas/report.schema';

const router = Router();

// Create report (authenticated)
router.post('/reports', authenticate, validate(createReportSchema), ReportController.createReport);

// Get all reports (moderator/admin only)
router.get('/reports', authenticate, requireModerator, ReportController.getReports);

// Update report status (moderator/admin only)
router.patch(
  '/reports/:reportId',
  authenticate,
  requireModerator,
  validate(updateReportStatusSchema),
  ReportController.updateReportStatus
);

export default router;



