import { prisma } from '@/config/database';
import { NotificationService } from './notification.service';
import { ReputationService } from './reputation.service';
import { getPaginationParams, createPaginationMeta } from '@/utils/pagination';
import { NotFoundError, AuthorizationError, ValidationError } from '@/types';

export class CommentService {
  static async getCommentsByPost(postId: string, page: number = 1, limit: number = 20, userId?: string) {
    const { skip, take } = getPaginationParams({ page, limit });

    // Verify post exists
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundError('Post não encontrado');
    }

    const where = {
      postId,
      parentId: null, // Only top-level comments
      isHidden: false,
    };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              reputation: true,
              level: true,
            },
          },
          voteList: userId
            ? {
                where: { userId },
                select: { type: true },
              }
            : false,
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                  reputation: true,
                  level: true,
                },
              },
              voteList: userId
                ? {
                    where: { userId },
                    select: { type: true },
                  }
                : false,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: [
          { isAccepted: 'desc' }, // Accepted answers first
          { votes: 'desc' },
          { createdAt: 'asc' },
        ],
        skip,
        take,
      }),
      prisma.comment.count({ where }),
    ]);

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      postId: comment.postId,
      author: comment.author,
      votes: comment.votes,
      userVote: comment.voteList?.[0]?.type?.toLowerCase() || null,
      isAccepted: comment.isAccepted,
      createdAt: comment.createdAt,
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        postId: reply.postId,
        author: reply.author,
        votes: reply.votes,
        userVote: reply.voteList?.[0]?.type?.toLowerCase() || null,
        createdAt: reply.createdAt,
      })),
    }));

    return {
      data: formattedComments,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  static async createComment(
    postId: string,
    authorId: string,
    content: string,
    parentId?: string
  ) {
    // Verify post exists and is not locked
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundError('Post não encontrado');
    }

    if (post.isLocked) {
      throw new ValidationError('Este post está bloqueado para novos comentários');
    }

    // If parentId, verify parent comment exists
    let parentComment = null;
    if (parentId) {
      parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        include: { author: true },
      });

      if (!parentComment || parentComment.postId !== postId) {
        throw new NotFoundError('Comentário pai não encontrado');
      }
    }

    // Create comment and update post comment count
    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          content,
          postId,
          authorId,
          parentId,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              reputation: true,
              level: true,
            },
          },
        },
      });

      // Increment post comment count
      await tx.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });

      return newComment;
    });

    // Send notifications asynchronously
    const author = await prisma.user.findUnique({ where: { id: authorId } });
    
    if (parentComment) {
      // Notify parent comment author
      await NotificationService.notifyReply(
        parentComment.authorId,
        author!.username,
        authorId,
        postId,
        comment.id
      );
    } else {
      // Notify post author
      await NotificationService.notifyComment(
        post.authorId,
        author!.username,
        authorId,
        postId,
        post.slug,
        comment.id
      );
    }

    // TODO: Extract mentions and notify mentioned users

    return comment;
  }

  static async updateComment(commentId: string, content: string, userId: string, userRoles: string[]) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundError('Comentário não encontrado');
    }

    // Check authorization
    const isAuthor = comment.authorId === userId;
    const isModerator = userRoles.includes('MODERATOR') || userRoles.includes('ADMIN');

    if (!isAuthor && !isModerator) {
      throw new AuthorizationError();
    }

    return await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputation: true,
            level: true,
          },
        },
      },
    });
  }

  static async deleteComment(commentId: string, userId: string, userRoles: string[]) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundError('Comentário não encontrado');
    }

    // Check authorization
    const isAuthor = comment.authorId === userId;
    const isModerator = userRoles.includes('MODERATOR') || userRoles.includes('ADMIN');

    if (!isAuthor && !isModerator) {
      throw new AuthorizationError();
    }

    // Delete comment and decrement post comment count
    await prisma.$transaction(async (tx) => {
      await tx.comment.delete({
        where: { id: commentId },
      });

      await tx.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } },
      });
    });
  }

  static async acceptComment(commentId: string, postAuthorId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: true,
      },
    });

    if (!comment) {
      throw new NotFoundError('Comentário não encontrado');
    }

    // Only post author can accept answers
    if (comment.post.authorId !== postAuthorId) {
      throw new AuthorizationError('Apenas o autor do post pode aceitar respostas');
    }

    // Can't accept own comment
    if (comment.authorId === postAuthorId) {
      throw new ValidationError('Não pode aceitar o seu próprio comentário');
    }

    await prisma.$transaction(async (tx) => {
      // Unaccept previous accepted answer if exists
      const previousAccepted = await tx.comment.findFirst({
        where: {
          postId: comment.postId,
          isAccepted: true,
        },
      });

      if (previousAccepted) {
        await tx.comment.update({
          where: { id: previousAccepted.id },
          data: { isAccepted: false },
        });

        // Remove reputation from previous accepted answer author
        await ReputationService.updateReputation(
          previousAccepted.authorId,
          -ReputationService.getPointsForAction('ACCEPTED_ANSWER')
        );
      }

      // Accept new answer
      await tx.comment.update({
        where: { id: commentId },
        data: { isAccepted: true },
      });

      // Update post
      await tx.post.update({
        where: { id: comment.postId },
        data: { hasAcceptedAnswer: true },
      });
    });

    // Add reputation to comment author
    await ReputationService.updateReputation(
      comment.authorId,
      ReputationService.getPointsForAction('ACCEPTED_ANSWER')
    );

    // Add reputation to post author for accepting
    await ReputationService.updateReputation(
      postAuthorId,
      ReputationService.getPointsForAction('ACCEPT_ANSWER')
    );

    // Notify comment author
    await NotificationService.notifyAccepted(
      comment.authorId,
      comment.postId,
      commentId,
      postAuthorId
    );

    return comment;
  }
}



