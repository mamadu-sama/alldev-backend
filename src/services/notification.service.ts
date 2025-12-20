import { prisma } from "@/config/database";
import { NotificationType, Role } from "@prisma/client";
import { logger } from "@/utils/logger";
import { getPaginationParams, createPaginationMeta } from "@/utils/pagination";

export class NotificationService {
  /**
   * Get user notifications with pagination
   */
  static async getUserNotifications(
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
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          post: {
            select: {
              id: true,
              slug: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, read: false },
      }),
    ]);

    // Format notifications to include relatedPostSlug
    const formattedNotifications = notifications.map((notification) => ({
      ...notification,
      relatedPostSlug: notification.post?.slug,
      post: notification.post,
    }));

    return {
      notifications: formattedNotifications,
      meta: {
        ...createPaginationMeta({ page, limit, total }),
        unreadCount,
      },
    };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error("Notificação não encontrada");
    }

    if (notification.userId !== userId) {
      throw new Error("Sem permissão para marcar esta notificação");
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  /**
   * Mark all user notifications as read
   */
  static async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return { success: true };
  }

  /**
   * Get all notifications for admin panel
   */
  static async getAdminNotifications(options: {
    page: number;
    limit: number;
    type?: string;
    userId?: string;
  }) {
    const { page, limit, type, userId } = options;
    const { skip, take } = getPaginationParams({ page, limit });

    const where: any = {};

    if (type) {
      where.type = type as NotificationType;
    }

    if (userId) {
      where.userId = userId;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatarUrl: true,
            },
          },
          sender: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          post: {
            select: {
              id: true,
              slug: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      meta: createPaginationMeta({ page, limit, total }),
    };
  }

  /**
   * Send notification to specific user (internal use)
   */
  static async sendToUser(
    userId: string,
    type: NotificationType,
    message: string,
    options?: {
      title?: string;
      senderId?: string;
      relatedPostId?: string;
      relatedCommentId?: string;
    }
  ) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title: options?.title,
          message,
          senderId: options?.senderId,
          relatedPostId: options?.relatedPostId,
          relatedCommentId: options?.relatedCommentId,
        },
      });

      logger.info("Notification sent to user", {
        userId,
        type,
        notificationId: notification.id,
      });
      return notification;
    } catch (error) {
      logger.error("Error sending notification", { error, userId, type });
      throw error;
    }
  }

  /**
   * Send SYSTEM notification from admin to multiple users (broadcast)
   */
  static async sendBroadcastNotification(
    adminId: string,
    title: string,
    message: string,
    targetAudience: "all" | "admins" | "moderators" | "users"
  ) {
    try {
      // Get target users based on audience
      let targetUserIds: string[] = [];

      if (targetAudience === "all") {
        // Get all active users
        const users = await prisma.user.findMany({
          where: { isActive: true },
          select: { id: true },
        });
        targetUserIds = users.map((u) => u.id);
      } else {
        // Get users with specific roles
        const roleMap: Record<string, Role[]> = {
          admins: [Role.ADMIN],
          moderators: [Role.MODERATOR],
          users: [Role.USER],
        };

        const roles = roleMap[targetAudience] || [];

        const userRoles = await prisma.userRole.findMany({
          where: {
            role: { in: roles },
          },
          select: { userId: true },
          distinct: ["userId"],
        });

        targetUserIds = userRoles.map((ur) => ur.userId);
      }

      // Remove admin from target list (don't send to self)
      targetUserIds = targetUserIds.filter((id) => id !== adminId);

      if (targetUserIds.length === 0) {
        logger.warn("No target users found for broadcast", { targetAudience });
        return { sent: 0, targetAudience };
      }

      // Create notifications in batch
      const notifications = targetUserIds.map((userId) => ({
        userId,
        type: NotificationType.SYSTEM,
        title,
        message,
        senderId: adminId,
      }));

      // Use createMany for better performance (batch insert)
      await prisma.notification.createMany({
        data: notifications,
      });

      logger.info("Broadcast notification sent", {
        adminId,
        targetAudience,
        recipientCount: targetUserIds.length,
      });

      return {
        sent: targetUserIds.length,
        targetAudience,
      };
    } catch (error) {
      logger.error("Error sending broadcast notification", {
        error,
        adminId,
        targetAudience,
      });
      throw error;
    }
  }

  /**
   * Get broadcast notification history (for admin panel)
   */
  static async getBroadcastHistory(page: number = 1, limit: number = 50) {
    const { skip, take } = getPaginationParams({ page, limit });

    // Get SYSTEM notifications sent by admins/moderators
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: {
          type: NotificationType.SYSTEM,
          senderId: { not: null },
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        distinct: ["title", "message", "senderId"], // Group similar notifications
      }),
      prisma.notification.count({
        where: {
          type: NotificationType.SYSTEM,
          senderId: { not: null },
        },
      }),
    ]);

    // Get stats for each notification (how many sent, how many read)
    const notificationsWithStats = await Promise.all(
      notifications.map(async (notification) => {
        const stats = await prisma.notification.aggregate({
          where: {
            title: notification.title,
            message: notification.message,
            senderId: notification.senderId,
            type: NotificationType.SYSTEM,
          },
          _count: {
            id: true,
          },
        });

        const readCount = await prisma.notification.count({
          where: {
            title: notification.title,
            message: notification.message,
            senderId: notification.senderId,
            type: NotificationType.SYSTEM,
            read: true,
          },
        });

        return {
          ...notification,
          stats: {
            totalSent: stats._count.id,
            totalRead: readCount,
          },
        };
      })
    );

    return {
      notifications: notificationsWithStats,
      meta: createPaginationMeta({ page, limit, total }),
    };
  }

  /**
   * Delete old notifications (cleanup task)
   */
  static async deleteOldNotifications(daysOld: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        read: true, // Only delete read notifications
      },
    });

    logger.info(`Deleted ${result.count} old notifications`);
    return result.count;
  }

  /**
   * Notify user when someone comments on their post
   */
  static async notifyComment(
    postAuthorId: string,
    commenterUsername: string,
    commenterId: string,
    postId: string,
    _postSlug: string,
    commentId: string
  ) {
    // Don't notify if commenting on own post
    if (postAuthorId === commenterId) {
      return;
    }

    try {
      await this.sendToUser(
        postAuthorId,
        NotificationType.COMMENT,
        `${commenterUsername} comentou no seu post`,
        {
          senderId: commenterId,
          relatedPostId: postId,
          relatedCommentId: commentId,
        }
      );
    } catch (error) {
      logger.error("Error sending comment notification", {
        error,
        postAuthorId,
        commenterId,
      });
    }
  }

  /**
   * Notify user when someone replies to their comment
   */
  static async notifyReply(
    parentCommentAuthorId: string,
    replierUsername: string,
    replierId: string,
    postId: string,
    commentId: string
  ) {
    // Don't notify if replying to own comment
    if (parentCommentAuthorId === replierId) {
      return;
    }

    try {
      await this.sendToUser(
        parentCommentAuthorId,
        NotificationType.REPLY,
        `${replierUsername} respondeu ao seu comentário`,
        {
          senderId: replierId,
          relatedPostId: postId,
          relatedCommentId: commentId,
        }
      );
    } catch (error) {
      logger.error("Error sending reply notification", {
        error,
        parentCommentAuthorId,
        replierId,
      });
    }
  }

  /**
   * Notify user when their answer is accepted
   */
  static async notifyAccepted(
    commentAuthorId: string,
    postId: string,
    commentId: string,
    postAuthorId: string
  ) {
    // Don't notify if accepting own answer
    if (commentAuthorId === postAuthorId) {
      return;
    }

    try {
      // Get post author username
      const postAuthor = await prisma.user.findUnique({
        where: { id: postAuthorId },
        select: { username: true },
      });

      if (!postAuthor) {
        logger.error("Post author not found for accepted answer notification", {
          postAuthorId,
        });
        return;
      }

      await this.sendToUser(
        commentAuthorId,
        NotificationType.ACCEPTED,
        `${postAuthor.username} aceitou a sua resposta`,
        {
          senderId: postAuthorId,
          relatedPostId: postId,
          relatedCommentId: commentId,
        }
      );
    } catch (error) {
      logger.error("Error sending accepted answer notification", {
        error,
        commentAuthorId,
        postAuthorId,
      });
    }
  }

  /**
   * Notify user when someone votes on their content (aggregated)
   */
  static async notifyVote(
    contentAuthorId: string,
    voterUsername: string,
    voterId: string,
    postId: string,
    isUpvote: boolean
  ) {
    // Don't notify for downvotes or self-votes
    if (!isUpvote || contentAuthorId === voterId) {
      return;
    }

    try {
      // For now, send individual notifications
      // TODO: Implement vote aggregation (e.g., "5 people upvoted your post")
      await this.sendToUser(
        contentAuthorId,
        NotificationType.VOTE,
        `${voterUsername} votou positivamente no seu conteúdo`,
        {
          senderId: voterId,
          relatedPostId: postId,
        }
      );
    } catch (error) {
      logger.error("Error sending vote notification", {
        error,
        contentAuthorId,
        voterId,
      });
    }
  }
}
