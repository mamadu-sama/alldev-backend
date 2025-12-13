import { prisma } from '@/config/database';
import { Role } from '@prisma/client';
import { logger } from '@/utils/logger';
import { getPaginationParams, createPaginationMeta } from '@/utils/pagination';
import { NotFoundError, ValidationError } from '@/types';

export class AdminService {
  static async getAllUsers(page: number = 1, limit: number = 50) {
    const { skip, take } = getPaginationParams({ page, limit });

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
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count(),
    ]);

    return {
      data: users,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  static async updateUserRole(adminId: string, userId: string, roles: Role[]) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError('Utilizador não encontrado');
    }

    if (userId === adminId) {
      throw new ValidationError('Não pode alterar as suas próprias permissões');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roles },
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
      oldRoles: user.roles,
      newRoles: roles,
    });

    return updatedUser;
  }

  static async banUser(adminId: string, userId: string, reason: string, duration?: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError('Utilizador não encontrado');
    }

    if (userId === adminId) {
      throw new ValidationError('Não pode banir a si próprio');
    }

    if (user.roles.includes('ADMIN')) {
      throw new ValidationError('Não pode banir um administrador');
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      await tx.moderatorAction.create({
        data: {
          moderatorId: adminId,
          action: 'BAN_USER',
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
      throw new NotFoundError('Utilizador não encontrado');
    }

    if (user.isActive) {
      throw new ValidationError('Utilizador não está banido');
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isActive: true },
      });

      await tx.moderatorAction.create({
        data: {
          moderatorId: adminId,
          action: 'UNBAN_USER',
          reason: 'User unbanned',
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
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError('Utilizador não encontrado');
    }

    if (userId === adminId) {
      throw new ValidationError('Não pode deletar a si próprio');
    }

    if (user.roles.includes('ADMIN')) {
      throw new ValidationError('Não pode deletar um administrador');
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
    let maintenance = await prisma.maintenanceMode.findFirst();

    if (!maintenance) {
      // Create default maintenance mode entry
      maintenance = await prisma.maintenanceMode.create({
        data: {
          isActive: false,
          message: 'O site está em manutenção. Voltaremos em breve.',
          allowedRoles: ['ADMIN'],
        },
      });
    }

    return maintenance;
  }

  static async updateMaintenanceMode(
    adminId: string,
    isActive: boolean,
    message?: string,
    allowedRoles?: Role[]
  ) {
    let maintenance = await prisma.maintenanceMode.findFirst();

    if (!maintenance) {
      maintenance = await prisma.maintenanceMode.create({
        data: {
          isActive,
          message: message || 'O site está em manutenção. Voltaremos em breve.',
          allowedRoles: allowedRoles || ['ADMIN'],
        },
      });
    } else {
      maintenance = await prisma.maintenanceMode.update({
        where: { id: maintenance.id },
        data: {
          isActive,
          message: message || maintenance.message,
          allowedRoles: allowedRoles || maintenance.allowedRoles,
        },
      });
    }

    logger.info(`Maintenance mode updated by admin`, {
      adminId,
      isActive,
      message,
      allowedRoles,
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
      recentUsers,
      recentPosts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.tag.count(),
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
    };
  }
}


