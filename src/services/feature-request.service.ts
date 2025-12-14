import { prisma } from '@/config/database';
import { FeatureRequestCategory, FeatureRequestStatus } from '@prisma/client';
import { logger } from '@/utils/logger';
import { getPaginationParams, createPaginationMeta } from '@/utils/pagination';
import { NotFoundError, ValidationError } from '@/types';

export class FeatureRequestService {
  /**
   * Get all feature requests with filters
   */
  static async getAll(
    page: number = 1,
    limit: number = 20,
    sortBy: 'votes' | 'recent' | 'comments' = 'votes',
    category?: FeatureRequestCategory,
    status?: FeatureRequestStatus
  ) {
    const { skip, take } = getPaginationParams({ page, limit });

    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;

    const orderBy: any = {};
    if (sortBy === 'votes') orderBy.voteCount = 'desc';
    else if (sortBy === 'recent') orderBy.createdAt = 'desc';
    else if (sortBy === 'comments') orderBy.commentCount = 'desc';

    const [requests, total] = await Promise.all([
      prisma.featureRequest.findMany({
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
              votes: true,
              comments: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.featureRequest.count({ where }),
    ]);

    return {
      requests,
      meta: createPaginationMeta({ total, page, limit }),
    };
  }

  /**
   * Get feature request by ID with user vote status
   */
  static async getById(id: string, userId?: string) {
    const request = await prisma.featureRequest.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundError('Sugestão não encontrada');
    }

    let hasVoted = false;
    if (userId) {
      const vote = await prisma.featureRequestVote.findUnique({
        where: {
          featureRequestId_userId: {
            featureRequestId: id,
            userId,
          },
        },
      });
      hasVoted = !!vote;
    }

    return { ...request, hasVoted };
  }

  /**
   * Create feature request
   */
  static async create(authorId: string, data: {
    title: string;
    description: string;
    category: FeatureRequestCategory;
  }) {
    // Check for duplicate titles
    const existing = await prisma.featureRequest.findFirst({
      where: {
        title: {
          equals: data.title,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new ValidationError('Já existe uma sugestão com este título');
    }

    const request = await prisma.featureRequest.create({
      data: {
        ...data,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Auto-vote for own suggestion
    await this.toggleVote(request.id, authorId);

    logger.info('Feature request created', { requestId: request.id, authorId });
    return request;
  }

  /**
   * Toggle vote
   */
  static async toggleVote(requestId: string, userId: string) {
    const request = await prisma.featureRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError('Sugestão não encontrada');
    }

    const existingVote = await prisma.featureRequestVote.findUnique({
      where: {
        featureRequestId_userId: {
          featureRequestId: requestId,
          userId,
        },
      },
    });

    if (existingVote) {
      // Remove vote
      await prisma.$transaction([
        prisma.featureRequestVote.delete({
          where: { id: existingVote.id },
        }),
        prisma.featureRequest.update({
          where: { id: requestId },
          data: { voteCount: { decrement: 1 } },
        }),
      ]);

      return { hasVoted: false, voteCount: request.voteCount - 1 };
    } else {
      // Add vote
      await prisma.$transaction([
        prisma.featureRequestVote.create({
          data: {
            featureRequestId: requestId,
            userId,
          },
        }),
        prisma.featureRequest.update({
          where: { id: requestId },
          data: { voteCount: { increment: 1 } },
        }),
      ]);

      return { hasVoted: true, voteCount: request.voteCount + 1 };
    }
  }

  /**
   * Add comment (Admin only for now, but structure ready)
   */
  static async addComment(requestId: string, authorId: string, content: string) {
    const request = await prisma.featureRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError('Sugestão não encontrada');
    }

    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.featureRequestComment.create({
        data: {
          featureRequestId: requestId,
          authorId,
          content,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      await tx.featureRequest.update({
        where: { id: requestId },
        data: { commentCount: { increment: 1 } },
      });

      return newComment;
    });

    logger.info('Feature request comment added', { requestId, commentId: comment.id });
    return comment;
  }

  /**
   * Update status (Admin/Moderator only)
   */
  static async updateStatus(requestId: string, status: FeatureRequestStatus, adminId: string) {
    const request = await prisma.featureRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError('Sugestão não encontrada');
    }

    const updated = await prisma.featureRequest.update({
      where: { id: requestId },
      data: { status },
    });

    logger.info('Feature request status updated', {
      requestId,
      status,
      updatedBy: adminId,
    });

    return updated;
  }

  /**
   * Get stats
   */
  static async getStats() {
    const [total, inProgress, completed, totalVotes] = await Promise.all([
      prisma.featureRequest.count(),
      prisma.featureRequest.count({ where: { status: FeatureRequestStatus.IN_PROGRESS } }),
      prisma.featureRequest.count({ where: { status: FeatureRequestStatus.COMPLETED } }),
      prisma.featureRequest.aggregate({ _sum: { voteCount: true } }),
    ]);

    return {
      total,
      inProgress,
      completed,
      totalVotes: totalVotes._sum.voteCount || 0,
    };
  }
}

