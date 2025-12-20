import { prisma } from "@/config/database";
import { NotFoundError } from "@/types";
import { getPaginationParams, createPaginationMeta } from "@/utils/pagination";
import { logger } from "@/utils/logger";
import { ReportStatus, ModeratorActionType } from "@prisma/client";

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

    const urgentCommentReports = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*) as count
      FROM (
        SELECT comment_id
        FROM reports
        WHERE status = 'PENDING' AND comment_id IS NOT NULL
        GROUP BY comment_id
        HAVING COUNT(*) >= 3
      ) as urgent_comments
    `;

    const urgentCount =
      Number(urgentPostReports[0]?.count || 0) +
      Number(urgentCommentReports[0]?.count || 0);

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

    const resolvedPercentageChange =
      resolvedYesterday > 0
        ? Math.round(
            ((resolvedToday - resolvedYesterday) / resolvedYesterday) * 100
          )
        : resolvedToday > 0
        ? 100
        : 0;

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
    type?: "POST" | "COMMENT"
  ) {
    const { skip, take } = getPaginationParams({ page, limit });

    // Build where clause
    const where: any = {
      status: ReportStatus.PENDING,
    };

    if (type === "POST") {
      where.postId = { not: null };
    } else if (type === "COMMENT") {
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
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    // Group reports by target and calculate priority
    const groupedReports = new Map<string, any>();

    for (const report of reports) {
      const targetId = report.postId || report.commentId;
      const targetType = report.postId ? "POST" : "COMMENT";

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
      let calculatedPriority: "low" | "medium" | "high" | "urgent";
      if (reportCount >= 5) {
        calculatedPriority = "urgent";
      } else if (reportCount >= 3) {
        calculatedPriority = "high";
      } else if (reportCount >= 2) {
        calculatedPriority = "medium";
      } else {
        calculatedPriority = "low";
      }

      groupedReports.set(targetId, {
        id: targetId,
        type: targetType,
        content: report.post?.content || report.comment?.content || "",
        title: report.post?.title,
        slug: report.post?.slug || report.comment?.post?.slug,
        author: report.post?.author || report.comment?.author,
        reports: reportCount,
        reason: report.reason,
        priority: calculatedPriority,
        createdAt: (target as any).createdAt || report.createdAt,
        reportedAt: report.createdAt,
        firstReportId: report.id,
      });
    }

    let queueItems = Array.from(groupedReports.values());

    // Filter by priority if specified
    if (priority && priority !== "all") {
      queueItems = queueItems.filter((item) => item.priority === priority);
    }

    // Sort by priority
    const priorityOrder: Record<string, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    queueItems.sort(
      (a, b) =>
        (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999)
    );

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
      targetType: "POST" | "COMMENT";
      actionType: ModeratorActionType;
      reason?: string;
      notes?: string;
    }
  ) {
    const { targetId, targetType, actionType, reason, notes } = actionData;

    // Verify target exists
    if (targetType === "POST") {
      const post = await prisma.post.findUnique({ where: { id: targetId } });
      if (!post) {
        throw new NotFoundError("Post não encontrado.");
      }
    } else if (targetType === "COMMENT") {
      const comment = await prisma.comment.findUnique({
        where: { id: targetId },
      });
      if (!comment) {
        throw new NotFoundError("Comentário não encontrado.");
      }
    }

    return await prisma.$transaction(async (tx) => {
      // Create moderator action
      const action = await tx.moderatorAction.create({
        data: {
          moderatorId,
          actionType,
          reason: reason || "Moderação de conteúdo",
          notes,
          postId: targetType === "POST" ? targetId : undefined,
          commentId: targetType === "COMMENT" ? targetId : undefined,
        },
      });

      // Execute the action
      if (
        actionType === ModeratorActionType.HIDE_POST &&
        targetType === "POST"
      ) {
        await tx.post.update({
          where: { id: targetId },
          data: { isHidden: true },
        });
      } else if (
        actionType === ModeratorActionType.DELETE_COMMENT &&
        targetType === "COMMENT"
      ) {
        await tx.comment.delete({
          where: { id: targetId },
        });
      } else if (
        actionType === ModeratorActionType.DELETE_POST &&
        targetType === "POST"
      ) {
        await tx.post.delete({
          where: { id: targetId },
        });
      }

      // Resolve all pending reports for this target
      await tx.report.updateMany({
        where: {
          ...(targetType === "POST"
            ? { postId: targetId }
            : { commentId: targetId }),
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
      orderBy: { createdAt: "desc" },
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
        type: report.postId ? "post" : "comment",
        title: report.post?.title || `Comentário reportado`,
        author: report.post?.author || report.comment?.author,
        reports: reportCount,
        createdAt: report.createdAt,
      });

      if (uniqueItems.length >= limit) break;
    }

    return uniqueItems;
  }

  /**
   * Get reported posts with moderation details
   */
  static async getReportedPosts(
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: "visible" | "hidden" | "all"
  ) {
    const { skip, take } = getPaginationParams({ page, limit });

    // Build where clause
    const where: any = {};

    // Only get posts that have pending reports
    where.reports = {
      some: {
        status: ReportStatus.PENDING,
      },
    };

    if (status && status !== "all") {
      where.isHidden = status === "hidden";
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { username: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              reports: {
                where: { status: ReportStatus.PENDING },
              },
            },
          },
        },
        orderBy: {
          reports: {
            _count: "desc", // Posts with more reports first
          },
        },
        skip,
        take,
      }),
      prisma.post.count({ where }),
    ]);

    const data = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content.slice(0, 200), // Preview only
      slug: post.slug,
      author: post.author,
      reports: post._count.reports,
      status: post.isHidden ? "hidden" : "visible",
      createdAt: post.createdAt,
    }));

    const meta = createPaginationMeta({ total, page, limit });
    return { data, meta };
  }

  /**
   * Get reported comments with moderation details
   */
  static async getReportedComments(
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: "visible" | "hidden" | "all"
  ) {
    const { skip, take } = getPaginationParams({ page, limit });

    // Build where clause
    const where: any = {};

    // Only get comments that have pending reports
    where.reports = {
      some: {
        status: ReportStatus.PENDING,
      },
    };

    if (status && status !== "all") {
      // Assuming comments don't have isHidden field, we'll need to add it later if needed
      // For now, we'll just filter by all
    }

    if (search) {
      where.OR = [
        { content: { contains: search, mode: "insensitive" } },
        { author: { username: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          author: {
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
              slug: true,
            },
          },
          _count: {
            select: {
              reports: {
                where: { status: ReportStatus.PENDING },
              },
            },
          },
        },
        orderBy: {
          reports: {
            _count: "desc", // Comments with more reports first
          },
        },
        skip,
        take,
      }),
      prisma.comment.count({ where }),
    ]);

    const data = comments.map((comment) => ({
      id: comment.id,
      content: comment.content.slice(0, 200), // Preview only
      postTitle: comment.post.title,
      postId: comment.postId,
      postSlug: comment.post.slug,
      author: comment.author,
      reports: comment._count.reports,
      status: "visible", // Comments don't have hidden status yet
      createdAt: comment.createdAt,
    }));

    const meta = createPaginationMeta({ total, page, limit });
    return { data, meta };
  }

  /**
   * Get all reports with filters (for reports management page)
   */
  static async getReports(
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: ReportStatus,
    type?: "post" | "comment" | "all"
  ) {
    const { skip, take } = getPaginationParams({ page, limit });

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (type && type !== "all") {
      if (type === "post") {
        where.postId = { not: null };
      } else if (type === "comment") {
        where.commentId = { not: null };
      }
    }

    if (search) {
      where.OR = [
        { reason: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { reporter: { username: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
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
              slug: true,
              author: {
                select: {
                  id: true,
                  username: true,
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
                },
              },
            },
          },
          resolvedBy: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.report.count({ where }),
    ]);

    const data = reports.map((report) => ({
      id: report.id,
      type: report.postId ? "post" : "comment",
      reason: report.reason,
      description: report.description,
      reportedBy: report.reporter,
      target: {
        id: report.postId || report.commentId,
        title: report.post?.title,
        content: report.comment?.content?.slice(0, 100),
        username:
          report.post?.author.username || report.comment?.author.username,
      },
      status: report.status.toLowerCase(),
      resolvedBy: report.resolvedBy,
      resolvedAt: report.resolvedAt,
      resolverNotes: report.resolverNotes,
      createdAt: report.createdAt,
    }));

    const meta = createPaginationMeta({ total, page, limit });
    return { data, meta };
  }

  /**
   * Resolve or dismiss a report
   */
  static async resolveReport(
    moderatorId: string,
    reportId: string,
    action: "resolve" | "dismiss" | "escalate",
    notes?: string
  ) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundError("Denúncia não encontrada.");
    }

    const newStatus =
      action === "resolve"
        ? ReportStatus.RESOLVED
        : action === "dismiss"
        ? ReportStatus.DISMISSED
        : ReportStatus.PENDING; // Keep as pending if escalated

    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: newStatus,
        resolvedById: moderatorId,
        resolvedAt: new Date(),
        resolverNotes: notes,
      },
    });

    logger.info(`Report ${reportId} ${action}d by moderator ${moderatorId}`, {
      reportId,
      moderatorId,
      action,
      notes,
    });
  }

  /**
   * Get moderator action history
   */
  static async getModeratorHistory(
    moderatorId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    actionType?: ModeratorActionType
  ) {
    const { skip, take } = getPaginationParams({ page, limit });

    // Build where clause
    const where: any = {
      moderatorId,
    };

    if (actionType) {
      where.actionType = actionType;
    }

    if (search) {
      where.OR = [
        { reason: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { post: { title: { contains: search, mode: "insensitive" } } },
        { comment: { content: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [actions, total] = await Promise.all([
      prisma.moderatorAction.findMany({
        where,
        include: {
          moderator: {
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
              slug: true,
              author: {
                select: {
                  id: true,
                  username: true,
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
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.moderatorAction.count({ where }),
    ]);

    // Calculate stats for this moderator
    const [
      totalActions,
      approveCount,
      hidePostCount,
      deletePostCount,
      deleteCommentCount,
      warnCount,
    ] = await Promise.all([
      prisma.moderatorAction.count({ where: { moderatorId } }),
      prisma.moderatorAction.count({
        where: { moderatorId, actionType: ModeratorActionType.APPROVE_CONTENT },
      }),
      prisma.moderatorAction.count({
        where: { moderatorId, actionType: ModeratorActionType.HIDE_POST },
      }),
      prisma.moderatorAction.count({
        where: { moderatorId, actionType: ModeratorActionType.DELETE_POST },
      }),
      prisma.moderatorAction.count({
        where: { moderatorId, actionType: ModeratorActionType.DELETE_COMMENT },
      }),
      prisma.moderatorAction.count({
        where: { moderatorId, actionType: ModeratorActionType.WARN_USER },
      }),
    ]);

    const data = actions.map((action) => ({
      id: action.id,
      actionType: action.actionType,
      reason: action.reason,
      notes: action.notes,
      targetType: action.postId
        ? "POST"
        : action.commentId
        ? "COMMENT"
        : "USER",
      targetTitle:
        action.post?.title ||
        action.comment?.content?.slice(0, 50) ||
        "Ação de usuário",
      targetAuthor:
        action.post?.author.username ||
        action.comment?.author.username ||
        "N/A",
      postSlug: action.post?.slug,
      createdAt: action.createdAt,
    }));

    const stats = {
      total: totalActions,
      approved: approveCount,
      hidden: hidePostCount,
      deleted: deletePostCount + deleteCommentCount,
      warnings: warnCount,
    };

    const meta = createPaginationMeta({ total, page, limit });
    return { data, meta, stats };
  }
}
