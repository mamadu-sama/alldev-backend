import { Router } from 'express';
import { NotificationController } from '@/controllers/notification.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/role.middleware';
import { validate } from '@/middleware/validate.middleware';
import { sendAdminNotificationSchema } from '@/schemas/notification.schema';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User notification routes (authenticated users)
router.get('/notifications', NotificationController.getUserNotifications);
router.patch('/notifications/:notificationId/read', NotificationController.markAsRead);
router.post('/notifications/read-all', NotificationController.markAllAsRead);

// Admin notification routes (ADMIN only)
router.post(
  '/admin/notifications/broadcast',
  requireRole(Role.ADMIN),
  validate(sendAdminNotificationSchema),
  NotificationController.sendBroadcastNotification
);

router.get(
  '/admin/notifications/history',
  requireRole(Role.ADMIN),
  NotificationController.getBroadcastHistory
);

export default router;
