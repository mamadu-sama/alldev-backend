import { prisma } from "@/config/database";
import { Role } from "@prisma/client";
import { logger } from "@/utils/logger";
import { getPaginationParams, createPaginationMeta } from "@/utils/pagination";
import { NotFoundError, ValidationError } from "@/types";
import { clearMaintenanceCache } from "@/middleware/maintenance.middleware";

export class AdminService {
  static async getAllUsers(page: number = 1, limit: number = 50) {
    const { skip, take } = getPaginationParams({ page, limit });
    // Debug: log that getAllUsers is executing with params
    // eslint-disable-next-line no-console
    console.log("AdminService.getAllUsers", { page, limit, skip, take });

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true,
          bio: true,
          reputation: true,
          level: true,
          roles: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.user.count(),
    ]);

    return {
      data: users,
      meta: createPaginationMeta({ page, limit, total }),
    };
  }

  static async updateUserRole(adminId: string, userId: string, roles: Role[]) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) {
      throw new NotFoundError("Utilizador não encontrado");
    }

    if (userId === adminId) {
      throw new ValidationError("Não pode alterar as suas próprias permissões");
    }

    // Delete all existing roles and create new ones
    await prisma.$transaction(async (tx) => {
      // Delete existing roles
      await tx.userRole.deleteMany({
        where: { userId },
      });

      // Create new roles
      await tx.userRole.createMany({
        data: roles.map((role) => ({
          userId,
          role,
        })),
      });
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        roles: true,
      },
    });

    logger.info(`User roles updated by admin`, {
      adminId,
      userId,
      oldRoles: user.roles.map((r) => r.role),
      newRoles: roles,
    });

    return updatedUser;
  }

  static async banUser(
    adminId: string,
    userId: string,
    reason: string,
    duration?: number
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) {
      throw new NotFoundError("Utilizador não encontrado");
    }

    if (userId === adminId) {
      throw new ValidationError("Não pode banir a si próprio");
    }

    if (user.roles.some((r) => r.role === "ADMIN")) {
      throw new ValidationError("Não pode banir um administrador");
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      await tx.moderatorAction.create({
        data: {
          moderatorId: adminId,
          actionType: "BAN_USER",
          reason,
          targetUserId: userId,
        },
      });
    });

    logger.info(`User banned by admin`, {
      adminId,
      userId,
      reason,
      duration,
    });
  }

  static async unbanUser(adminId: string, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError("Utilizador não encontrado");
    }

    if (user.isActive) {
      throw new ValidationError("Utilizador não está banido");
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isActive: true },
      });

      await tx.moderatorAction.create({
        data: {
          moderatorId: adminId,
          actionType: "UNBAN_USER",
          reason: "User unbanned",
          targetUserId: userId,
        },
      });
    });

    logger.info(`User unbanned by admin`, {
      adminId,
      userId,
    });
  }

  static async deleteUser(adminId: string, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) {
      throw new NotFoundError("Utilizador não encontrado");
    }

    if (userId === adminId) {
      throw new ValidationError("Não pode deletar a si próprio");
    }

    if (user.roles.some((r) => r.role === "ADMIN")) {
      throw new ValidationError("Não pode deletar um administrador");
    }

    // Delete user and all related data (cascade)
    await prisma.user.delete({
      where: { id: userId },
    });

    logger.warn(`User deleted by admin`, {
      adminId,
      userId,
      username: user.username,
    });
  }

  static async getMaintenanceMode() {
    let maintenance = await prisma.maintenanceMode.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (!maintenance) {
      // Create default maintenance mode entry
      maintenance = await prisma.maintenanceMode.create({
        data: {
          isEnabled: false,
          message: "O site está em manutenção. Voltaremos em breve.",
        },
      });
    }

    return maintenance;
  }

  static async updateMaintenanceMode(
    adminId: string,
    isEnabled: boolean,
    message?: string,
    endTime?: Date | null
  ) {
    let maintenance = await prisma.maintenanceMode.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (!maintenance) {
      maintenance = await prisma.maintenanceMode.create({
        data: {
          isEnabled,
          message: message || "O site está em manutenção. Voltaremos em breve.",
          endTime: endTime || null,
          updatedBy: adminId,
        },
      });
    } else {
      maintenance = await prisma.maintenanceMode.update({
        where: { id: maintenance.id },
        data: {
          isEnabled,
          message: message || maintenance.message,
          endTime: endTime !== undefined ? endTime : maintenance.endTime,
          updatedBy: adminId,
        },
      });
    }

    // Clear maintenance cache so changes take effect immediately
    clearMaintenanceCache();

    logger.info(`Maintenance mode updated by admin`, {
      adminId,
      isEnabled,
      message,
      endTime,
    });

    return maintenance;
  }

  static async getStatistics() {
    const [
      totalUsers,
      activeUsers,
      totalPosts,
      totalComments,
      totalTags,
      pendingReports,
      recentUsers,
      recentPosts,
      totalViews,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.tag.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      prisma.post.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      prisma.post.aggregate({
        _sum: {
          views: true,
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        recentWeek: recentUsers,
      },
      posts: {
        total: totalPosts,
        recentWeek: recentPosts,
      },
      comments: {
        total: totalComments,
      },
      tags: {
        total: totalTags,
      },
      reports: {
        pending: pendingReports,
      },
      views: {
        total: totalViews._sum.views || 0,
      },
    };
  }

  static async getRecentPosts(limit: number = 10) {
    return await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  static async getRecentUsers(limit: number = 10) {
    return await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        level: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  // Posts Management
  static async getAllPosts(page: number = 1, limit: number = 50) {
    const { skip, take } = getPaginationParams({ page, limit });

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          votes: true,
          views: true,
          commentCount: true,
          hasAcceptedAnswer: true,
          isHidden: true,
          isLocked: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.post.count(),
    ]);

    return {
      data: posts,
      meta: createPaginationMeta({ page, limit, total }),
    };
  }

  static async deletePost(adminId: string, postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: { include: { roles: true } } },
    });

    if (!post) {
      throw new NotFoundError("Post não encontrado");
    }

    // Cannot delete admin's posts
    if (post.author.roles.some((r) => r.role === "ADMIN")) {
      throw new ValidationError("Não pode deletar posts de administradores");
    }

    await prisma.$transaction(async (tx) => {
      // Create moderator action BEFORE deleting post
      await tx.moderatorAction.create({
        data: {
          moderatorId: adminId,
          actionType: "DELETE_POST",
          reason: "Post deleted by admin",
          postId: postId,
        },
      });

      // Delete post (will set postId to null in moderatorAction due to onDelete: SetNull)
      await tx.post.delete({
        where: { id: postId },
      });
    });

    logger.warn(`Post deleted by admin`, {
      adminId,
      postId,
      title: post.title,
    });
  }

  static async hidePost(adminId: string, postId: string, reason: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundError("Post não encontrado");
    }

    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: postId },
        data: { isHidden: true },
      });

      await tx.moderatorAction.create({
        data: {
          moderatorId: adminId,
          actionType: "HIDE_POST",
          reason,
          postId: postId,
        },
      });
    });

    logger.info(`Post hidden by admin`, { adminId, postId, reason });
  }

  static async unhidePost(adminId: string, postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundError("Post não encontrado");
    }

    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: postId },
        data: { isHidden: false },
      });

      await tx.moderatorAction.create({
        data: {
          moderatorId: adminId,
          actionType: "UNHIDE_POST",
          reason: "Post unhidden by admin",
          postId: postId,
        },
      });
    });

    logger.info(`Post unhidden by admin`, { adminId, postId });
  }

  // Comments Management
  static async getAllComments(page: number = 1, limit: number = 50) {
    const { skip, take } = getPaginationParams({ page, limit });

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        select: {
          id: true,
          content: true,
          votes: true,
          isAccepted: true,
          createdAt: true,
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
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.comment.count(),
    ]);

    return {
      data: comments,
      meta: createPaginationMeta({ page, limit, total }),
    };
  }

  static async deleteComment(adminId: string, commentId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: { include: { roles: true } } },
    });

    if (!comment) {
      throw new NotFoundError("Comentário não encontrado");
    }

    // Cannot delete admin's comments
    if (comment.author.roles.some((r) => r.role === "ADMIN")) {
      throw new ValidationError(
        "Não pode deletar comentários de administradores"
      );
    }

    await prisma.$transaction(async (tx) => {
      // Create moderator action BEFORE deleting comment
      await tx.moderatorAction.create({
        data: {
          moderatorId: adminId,
          actionType: "DELETE_COMMENT",
          reason: "Comment deleted by admin",
          commentId: commentId,
        },
      });

      // Delete comment (will set commentId to null in moderatorAction due to onDelete: SetNull)
      await tx.comment.delete({
        where: { id: commentId },
      });
    });

    logger.warn(`Comment deleted by admin`, {
      adminId,
      commentId,
    });
  }
}
