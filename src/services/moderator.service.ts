import { prisma } from '@/config/database';
import { NotFoundError, UnauthorizedError } from '@/types';
import { getPaginationParams, createPaginationMeta } from '@/utils/pagination';
import { logger } from '@/utils/logger';
import { ReportStatus, ModeratorActionType } from '@prisma/client';

export class ModeratorService {
  /**
   * Get moderator dashboard statistics
   */
  static async getDashboardStats(moderatorId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      pendingReports,
      resolvedToday,
      hiddenPostsThisWeek,
      warningsThisMonth,
      reportsThisWeek,
    ] = await Promise.all([
      prisma.report.count({
        where: { status: ReportStatus.PENDING },
      }),
      prisma.moderatorAction.count({
        where: {
          moderatorId,
          createdAt: { gte: today },
        },
      }),
      prisma.moderatorAction.count({
        where: {
          moderatorId,
          actionType: ModeratorActionType.HIDE_POST,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.moderatorAction.count({
        where: {
          moderatorId,
          actionType: ModeratorActionType.WARN_USER,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.report.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Get urgent reports (multiple reports on same content)
    // We need to count unique post_id and comment_id separately, then combine
    const urgentPostReports = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM (
        SELECT post_id
        FROM reports
        WHERE status = 'PENDING' AND post_id IS NOT NULL
        GROUP BY post_id
        HAVING COUNT(*) >= 3
      ) as urgent_posts
    `;

    const urgentCommentReports = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM (
        SELECT comment_id
        FROM reports
        WHERE status = 'PENDING' AND comment_id IS NOT NULL
        GROUP BY comment_id
        HAVING COUNT(*) >= 3
      ) as urgent_comments
    `;

    const urgentCount = Number(urgentPostReports[0]?.count || 0) + Number(urgentCommentReports[0]?.count || 0);

    // Calculate resolved percentage vs yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const resolvedYesterday = await prisma.moderatorAction.count({
      where: {
        moderatorId,
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    const resolvedPercentageChange = resolvedYesterday > 0
      ? Math.round(((resolvedToday - resolvedYesterday) / resolvedYesterday) * 100)
      : resolvedToday > 0 ? 100 : 0;

    return {
      pendingReports,
      urgentReports: urgentCount,
      resolvedToday,
      resolvedPercentageChange,
      hiddenPostsThisWeek,
      warningsThisMonth,
      reportsThisWeek,
    };
  }

  /**
   * Get moderation queue with priority sorting
   */
  static async getQueue(
    page: number = 1,
    limit: number = 20,
    priority?: string,
    type?: 'POST' | 'COMMENT'
  ) {
    const { skip, take } = getPaginationParams({ page, limit });

    // Build where clause
    const where: any = {
      status: ReportStatus.PENDING,
    };

    if (type === 'POST') {
      where.postId = { not: null };
    } else if (type === 'COMMENT') {
      where.commentId = { not: null };
    }

    // Get reports with aggregated count
    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            content: true,
            slug: true,
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                reputation: true,
              },
            },
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                reputation: true,
              },
            },
            post: {
              select: {
                id: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    // Group reports by target and calculate priority
    const groupedReports = new Map<string, any>();

    for (const report of reports) {
      const targetId = report.postId || report.commentId;
      const targetType = report.postId ? 'POST' : 'COMMENT';
      
      if (!targetId) continue;
      if (groupedReports.has(targetId)) continue;
      
      const target = report.post || report.comment;
      if (!target) continue;

      const reportCount = await prisma.report.count({
        where: {
          ...(report.postId ? { postId: targetId } : { commentId: targetId }),
          status: ReportStatus.PENDING,
        },
      });

      // Calculate priority based on report count and time
      let calculatedPriority: 'low' | 'medium' | 'high' | 'urgent';
      if (reportCount >= 5) {
        calculatedPriority = 'urgent';
      } else if (reportCount >= 3) {
        calculatedPriority = 'high';
      } else if (reportCount >= 2) {
        calculatedPriority = 'medium';
      } else {
        calculatedPriority = 'low';
      }

      groupedReports.set(targetId, {
        id: targetId,
        type: targetType,
        content: report.post?.content || report.comment?.content || '',
        title: report.post?.title,
        slug: report.post?.slug || report.comment?.post?.slug,
        author: report.post?.author || report.comment?.author,
        reports: reportCount,
        reason: report.reason,
        priority: calculatedPriority,
        createdAt: target.createdAt || report.createdAt,
        reportedAt: report.createdAt,
        firstReportId: report.id,
      });
    }

    let queueItems = Array.from(groupedReports.values());

    // Filter by priority if specified
    if (priority && priority !== 'all') {
      queueItems = queueItems.filter((item) => item.priority === priority);
    }

    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    queueItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const total = queueItems.length;
    const meta = createPaginationMeta({ total, page, limit });

    return { data: queueItems, meta };
  }

  /**
   * Get queue statistics by priority
   */
  static async getQueueStats() {
    const pendingReports = await prisma.report.findMany({
      where: { status: ReportStatus.PENDING },
      select: {
        postId: true,
        commentId: true,
      },
    });

    // Group by target (postId or commentId) to count unique items
    const uniqueTargets = new Map<string, number>();
    
    for (const report of pendingReports) {
      const targetId = report.postId || report.commentId;
      if (!targetId) continue;
      
      const count = uniqueTargets.get(targetId) || 0;
      uniqueTargets.set(targetId, count + 1);
    }

    // Count by priority
    let urgent = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    for (const count of uniqueTargets.values()) {
      if (count >= 5) {
        urgent++;
      } else if (count >= 3) {
        high++;
      } else if (count >= 2) {
        medium++;
      } else {
        low++;
      }
    }

    return {
      urgent,
      high,
      medium,
      low,
      total: uniqueTargets.size,
    };
  }

  /**
   * Take moderation action
   */
  static async takeAction(
    moderatorId: string,
    actionData: {
      targetId: string;
      targetType: 'POST' | 'COMMENT';
      actionType: ModeratorActionType;
      reason?: string;
      notes?: string;
    }
  ) {
    const { targetId, targetType, actionType, reason, notes } = actionData;

    // Verify target exists
    if (targetType === 'POST') {
      const post = await prisma.post.findUnique({ where: { id: targetId } });
      if (!post) {
        throw new NotFoundError('Post não encontrado.');
      }
    } else if (targetType === 'COMMENT') {
      const comment = await prisma.comment.findUnique({ where: { id: targetId } });
      if (!comment) {
        throw new NotFoundError('Comentário não encontrado.');
      }
    }

    return await prisma.$transaction(async (tx) => {
      // Create moderator action
      const action = await tx.moderatorAction.create({
        data: {
          moderatorId,
          actionType,
          reason: reason || 'Moderação de conteúdo',
          notes,
          postId: targetType === 'POST' ? targetId : undefined,
          commentId: targetType === 'COMMENT' ? targetId : undefined,
        },
      });

      // Execute the action
      if (actionType === ModeratorActionType.HIDE_POST && targetType === 'POST') {
        await tx.post.update({
          where: { id: targetId },
          data: { isHidden: true },
        });
      } else if (actionType === ModeratorActionType.DELETE_COMMENT && targetType === 'COMMENT') {
        await tx.comment.delete({
          where: { id: targetId },
        });
      } else if (actionType === ModeratorActionType.DELETE_POST && targetType === 'POST') {
        await tx.post.delete({
          where: { id: targetId },
        });
      }

      // Resolve all pending reports for this target
      await tx.report.updateMany({
        where: {
          ...(targetType === 'POST' ? { postId: targetId } : { commentId: targetId }),
          status: ReportStatus.PENDING,
        },
        data: {
          status: ReportStatus.RESOLVED,
          resolvedById: moderatorId,
          resolvedAt: new Date(),
          resolverNotes: notes,
        },
      });

      logger.info(`Moderator action taken`, {
        moderatorId,
        actionType,
        targetId,
        targetType,
      });

      return action;
    });
  }

  /**
   * Get recent moderation queue items (for dashboard preview)
   */
  static async getRecentQueueItems(limit: number = 5) {
    const reports = await prisma.report.findMany({
      where: { status: ReportStatus.PENDING },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            author: {
              select: {
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 2, // Get more to ensure we have enough unique items
    });

    // Group by target and take top items
    const seen = new Set<string>();
    const uniqueItems = [];

    for (const report of reports) {
      const targetId = report.postId || report.commentId;
      if (!targetId) continue;
      if (seen.has(targetId)) continue;
      seen.add(targetId);

      const reportCount = await prisma.report.count({
        where: {
          ...(report.postId ? { postId: targetId } : { commentId: targetId }),
          status: ReportStatus.PENDING,
        },
      });
      
      uniqueItems.push({
        id: targetId,
        type: report.postId ? 'post' : 'comment',
        title: report.post?.title || `Comentário reportado`,
        author: report.post?.author || report.comment?.author,
        reports: reportCount,
        createdAt: report.createdAt,
      });

      if (uniqueItems.length >= limit) break;
    }

    return uniqueItems;
  }
}

