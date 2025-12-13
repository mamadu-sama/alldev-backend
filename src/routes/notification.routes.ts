import { Router } from 'express';
import { NotificationController } from '@/controllers/notification.controller';
import { authenticate } from '@/middleware/auth.middleware';

const router = Router();

// Get notifications (authenticated)
router.get('/notifications', authenticate, NotificationController.getNotifications);

// Mark notification as read (authenticated)
router.patch(
  '/notifications/:notificationId/read',
  authenticate,
  NotificationController.markAsRead
);

// Mark all notifications as read (authenticated)
router.post('/notifications/read-all', authenticate, NotificationController.markAllAsRead);

export default router;


