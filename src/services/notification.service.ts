import { prisma } from '@/config/database';
import { NotificationType } from '@prisma/client';
import { logger } from '@/utils/logger';
import { getPaginationParams, createPaginationMeta } from '@/utils/pagination';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  message: string;
  title?: string;
  relatedPostId?: string;
  relatedCommentId?: string;
  senderId?: string;
}

export class NotificationService {
  static async create(params: CreateNotificationParams): Promise<void> {
    try {
      // Don't notify users of their own actions
      if (params.userId === params.senderId) {
        return;
      }

      await prisma.notification.create({
        data: params,
      });
    } catch (error) {
      logger.error('Failed to create notification:', error);
    }
  }

  static async notifyComment(
    postAuthorId: string,
    commenterUsername: string,
    commenterId: string,
    postId: string,
    postSlug: string,
    commentId: string
  ): Promise<void> {
    await this.create({
      userId: postAuthorId,
      type: 'COMMENT',
      message: `${commenterUsername} comentou no seu post`,
      relatedPostId: postId,
      relatedCommentId: commentId,
      senderId: commenterId,
    });
  }

  static async notifyReply(
    parentCommentAuthorId: string,
    replierUsername: string,
    replierId: string,
    postId: string,
    commentId: string
  ): Promise<void> {
    await this.create({
      userId: parentCommentAuthorId,
      type: 'REPLY',
      message: `${replierUsername} respondeu ao seu comentário`,
      relatedPostId: postId,
      relatedCommentId: commentId,
      senderId: replierId,
    });
  }

  static async notifyAccepted(
    commentAuthorId: string,
    postId: string,
    commentId: string,
    accepterId: string
  ): Promise<void> {
    await this.create({
      userId: commentAuthorId,
      type: 'ACCEPTED',
      message: 'A sua resposta foi aceite!',
      relatedPostId: postId,
      relatedCommentId: commentId,
      senderId: accepterId,
    });
  }

  static async notifyMention(
    mentionedUserId: string,
    mentionerUsername: string,
    mentionerId: string,
    postId: string,
    commentId?: string
  ): Promise<void> {
    await this.create({
      userId: mentionedUserId,
      type: 'MENTION',
      message: `${mentionerUsername} mencionou você`,
      relatedPostId: postId,
      relatedCommentId: commentId,
      senderId: mentionerId,
    });
  }

  static async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ) {
    const { skip, take } = getPaginationParams({ page, limit });

    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return {
      data: notifications,
      meta: {
        ...createPaginationMeta(page, limit, total),
        unreadCount,
      },
    };
  }

  static async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notificação não encontrada');
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  static async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  static async deleteOldNotifications(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deleted = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        read: true,
      },
    });

    logger.info(`Deleted ${deleted.count} old notifications`);
  }
}


