import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '@/services/notification.service';
import { sendAdminNotificationSchema } from '@/schemas/notification.schema';

export class NotificationController {
  /**
   * Get user notifications (authenticated user only)
   */
  static async getUserNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20, unreadOnly = false } = req.query;

      const result = await NotificationService.getUserNotifications(
        userId,
        Number(page),
        Number(limit),
        unreadOnly === 'true'
      );

      res.json({
        success: true,
        data: result.notifications,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { notificationId } = req.params;

      const notification = await NotificationService.markAsRead(notificationId, userId);

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const result = await NotificationService.markAllAsRead(userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send broadcast notification (ADMIN only)
   */
  static async sendBroadcastNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.id;
      const { title, message, targetAudience } = sendAdminNotificationSchema.parse(req.body);

      const result = await NotificationService.sendBroadcastNotification(
        adminId,
        title,
        message,
        targetAudience
      );

      res.status(201).json({
        success: true,
        data: result,
        message: `Notificação enviada para ${result.sent} usuário(s)`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get broadcast history (ADMIN only)
   */
  static async getBroadcastHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 50 } = req.query;

      const result = await NotificationService.getBroadcastHistory(Number(page), Number(limit));

      res.json({
        success: true,
        data: result.notifications,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }
}

