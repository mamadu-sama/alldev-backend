import { Router } from "express";
import { NotificationController } from "@/controllers/notification.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import { notificationRateLimiter } from "@/middleware/rateLimiter.middleware";
import { sendAdminNotificationSchema } from "@/schemas/notification.schema";
import { Role } from "@prisma/client";

const router = Router();

// User notification routes (authenticated) with specific rate limiting for polling
router.get(
  "/notifications",
  notificationRateLimiter,
  authenticate,
  NotificationController.getUserNotifications
);

router.patch(
  "/notifications/:notificationId/read",
  authenticate,
  NotificationController.markAsRead
);

router.post(
  "/notifications/mark-all-read",
  authenticate,
  NotificationController.markAllAsRead
);

// Admin notification routes
router.get(
  "/admin/notifications",
  authenticate,
  requireRole(Role.ADMIN),
  NotificationController.getAdminNotifications
);

router.post(
  "/admin/notifications/broadcast",
  authenticate,
  requireRole(Role.ADMIN),
  validate(sendAdminNotificationSchema),
  NotificationController.sendBroadcastNotification
);

router.get(
  "/admin/notifications/broadcast/history",
  authenticate,
  requireRole(Role.ADMIN),
  NotificationController.getBroadcastHistory
);

export default router;
