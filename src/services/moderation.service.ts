import { prisma } from '@/config/database';
import { Role } from '@prisma/client';
import { logger } from '@/utils/logger';
import { getPaginationParams, createPaginationMeta } from '@/utils/pagination';
import { NotFoundError, ValidationError } from '@/types';

export class ModerationService {
  static async hidePost(postId: string, moderatorId: string, reason: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundError('Post não encontrado');
    }

    if (post.isHidden) {
      throw new ValidationError('Post já está oculto');
    }

    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: postId },
        data: { isHidden: true },
      });

      await tx.moderatorAction.create({
        data: {
          moderatorId,
          action: 'HIDE_POST',
          reason,
          targetPostId: postId,
        },
      });
    });

    logger.info(`Post hidden by moderator`, {
      postId,
      moderatorId,
      reason,
    });
  }

  static async unhidePost(postId: string, moderatorId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundError('Post não encontrado');
    }

    if (!post.isHidden) {
      throw new ValidationError('Post não está oculto');
    }

    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: postId },
        data: { isHidden: false },
      });

      await tx.moderatorAction.create({
        data: {
          moderatorId,
          action: 'UNHIDE_POST',
          reason: 'Post restored',
          targetPostId: postId,
        },
      });
    });

    logger.info(`Post unhidden by moderator`, {
      postId,
      moderatorId,
    });
  }

  static async lockPost(postId: string, moderatorId: string, reason: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundError('Post não encontrado');
    }

    if (post.isLocked) {
      throw new ValidationError('Post já está bloqueado');
    }

    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: postId },
        data: { isLocked: true },
      });

      await tx.moderatorAction.create({
        data: {
          moderatorId,
          action: 'LOCK_POST',
          reason,
          targetPostId: postId,
        },
      });
    });

    logger.info(`Post locked by moderator`, {
      postId,
      moderatorId,
      reason,
    });
  }

  static async unlockPost(postId: string, moderatorId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundError('Post não encontrado');
    }

    if (!post.isLocked) {
      throw new ValidationError('Post não está bloqueado');
    }

    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: postId },
        data: { isLocked: false },
      });

      await tx.moderatorAction.create({
        data: {
          moderatorId,
          action: 'UNLOCK_POST',
          reason: 'Post unlocked',
          targetPostId: postId,
        },
      });
    });

    logger.info(`Post unlocked by moderator`, {
      postId,
      moderatorId,
    });
  }

  static async hideComment(commentId: string, moderatorId: string, reason: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      throw new NotFoundError('Comentário não encontrado');
    }

    if (comment.isHidden) {
      throw new ValidationError('Comentário já está oculto');
    }

    await prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id: commentId },
        data: { isHidden: true },
      });

      await tx.moderatorAction.create({
        data: {
          moderatorId,
          action: 'HIDE_COMMENT',
          reason,
          targetCommentId: commentId,
        },
      });
    });

    logger.info(`Comment hidden by moderator`, {
      commentId,
      moderatorId,
      reason,
    });
  }

  static async unhideComment(commentId: string, moderatorId: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      throw new NotFoundError('Comentário não encontrado');
    }

    if (!comment.isHidden) {
      throw new ValidationError('Comentário não está oculto');
    }

    await prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id: commentId },
        data: { isHidden: false },
      });

      await tx.moderatorAction.create({
        data: {
          moderatorId,
          action: 'UNHIDE_COMMENT',
          reason: 'Comment restored',
          targetCommentId: commentId,
        },
      });
    });

    logger.info(`Comment unhidden by moderator`, {
      commentId,
      moderatorId,
    });
  }

  static async getModerationActions(page: number = 1, limit: number = 50) {
    const { skip, take } = getPaginationParams({ page, limit });

    const [actions, total] = await Promise.all([
      prisma.moderatorAction.findMany({
        include: {
          moderator: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          targetPost: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          targetComment: {
            select: {
              id: true,
              content: true,
            },
          },
          targetUser: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.moderatorAction.count(),
    ]);

    return {
      data: actions,
      meta: createPaginationMeta(page, limit, total),
    };
  }
}



