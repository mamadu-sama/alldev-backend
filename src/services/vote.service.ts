import { prisma } from '@/config/database';
import { VoteType } from '@prisma/client';
import { ReputationService } from './reputation.service';
import { NotFoundError, ValidationError } from '@/types';

export class VoteService {
  static async vote(
    userId: string,
    type: 'up' | 'down',
    postId?: string,
    commentId?: string
  ) {
    const voteType: VoteType = type === 'up' ? 'UP' : 'DOWN';

    // Validate that we have either postId or commentId
    if (!postId && !commentId) {
      throw new ValidationError('Deve fornecer postId ou commentId');
    }

    if (postId && commentId) {
      throw new ValidationError('Não pode votar em post e comentário simultaneamente');
    }

    if (postId) {
      return await this.votePost(userId, postId, voteType);
    } else {
      return await this.voteComment(userId, commentId!, voteType);
    }
  }

  private static async votePost(userId: string, postId: string, voteType: VoteType) {
    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: true },
    });

    if (!post) {
      throw new NotFoundError('Post não encontrado');
    }

    // Can't vote on own post
    if (post.authorId === userId) {
      throw new ValidationError('Não pode votar no seu próprio post');
    }

    // Check if user already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    let voteDelta = 0;
    let reputationChange = 0;

    await prisma.$transaction(async (tx) => {
      if (existingVote) {
        if (existingVote.type === voteType) {
          // Remove vote
          await tx.vote.delete({
            where: { id: existingVote.id },
          });
          voteDelta = voteType === 'UP' ? -1 : 1;
          reputationChange =
            voteType === 'UP'
              ? -ReputationService.getPointsForAction('UPVOTE_POST')
              : -ReputationService.getPointsForAction('DOWNVOTE_POST');
        } else {
          // Change vote
          await tx.vote.update({
            where: { id: existingVote.id },
            data: { type: voteType },
          });
          voteDelta = voteType === 'UP' ? 2 : -2;
          const oldRepChange =
            existingVote.type === 'UP'
              ? ReputationService.getPointsForAction('UPVOTE_POST')
              : ReputationService.getPointsForAction('DOWNVOTE_POST');
          const newRepChange =
            voteType === 'UP'
              ? ReputationService.getPointsForAction('UPVOTE_POST')
              : ReputationService.getPointsForAction('DOWNVOTE_POST');
          reputationChange = newRepChange - oldRepChange;
        }
      } else {
        // New vote
        await tx.vote.create({
          data: {
            userId,
            postId,
            type: voteType,
          },
        });
        voteDelta = voteType === 'UP' ? 1 : -1;
        reputationChange =
          voteType === 'UP'
            ? ReputationService.getPointsForAction('UPVOTE_POST')
            : ReputationService.getPointsForAction('DOWNVOTE_POST');
      }

      // Update post votes
      await tx.post.update({
        where: { id: postId },
        data: { votes: { increment: voteDelta } },
      });
    });

    // Update author reputation
    if (reputationChange !== 0) {
      await ReputationService.updateReputation(post.authorId, reputationChange);
    }

    // Get updated post
    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        voteList: {
          where: { userId },
          select: { type: true },
        },
      },
    });

    return {
      votes: updatedPost!.votes,
      userVote: updatedPost!.voteList[0]?.type?.toLowerCase() || null,
    };
  }

  private static async voteComment(userId: string, commentId: string, voteType: VoteType) {
    // Verify comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: true },
    });

    if (!comment) {
      throw new NotFoundError('Comentário não encontrado');
    }

    // Can't vote on own comment
    if (comment.authorId === userId) {
      throw new ValidationError('Não pode votar no seu próprio comentário');
    }

    // Check if user already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });

    let voteDelta = 0;
    let reputationChange = 0;

    await prisma.$transaction(async (tx) => {
      if (existingVote) {
        if (existingVote.type === voteType) {
          // Remove vote
          await tx.vote.delete({
            where: { id: existingVote.id },
          });
          voteDelta = voteType === 'UP' ? -1 : 1;
          reputationChange =
            voteType === 'UP'
              ? -ReputationService.getPointsForAction('UPVOTE_COMMENT')
              : -ReputationService.getPointsForAction('DOWNVOTE_COMMENT');
        } else {
          // Change vote
          await tx.vote.update({
            where: { id: existingVote.id },
            data: { type: voteType },
          });
          voteDelta = voteType === 'UP' ? 2 : -2;
          const oldRepChange =
            existingVote.type === 'UP'
              ? ReputationService.getPointsForAction('UPVOTE_COMMENT')
              : ReputationService.getPointsForAction('DOWNVOTE_COMMENT');
          const newRepChange =
            voteType === 'UP'
              ? ReputationService.getPointsForAction('UPVOTE_COMMENT')
              : ReputationService.getPointsForAction('DOWNVOTE_COMMENT');
          reputationChange = newRepChange - oldRepChange;
        }
      } else {
        // New vote
        await tx.vote.create({
          data: {
            userId,
            commentId,
            type: voteType,
          },
        });
        voteDelta = voteType === 'UP' ? 1 : -1;
        reputationChange =
          voteType === 'UP'
            ? ReputationService.getPointsForAction('UPVOTE_COMMENT')
            : ReputationService.getPointsForAction('DOWNVOTE_COMMENT');
      }

      // Update comment votes
      await tx.comment.update({
        where: { id: commentId },
        data: { votes: { increment: voteDelta } },
      });
    });

    // Update author reputation
    if (reputationChange !== 0) {
      await ReputationService.updateReputation(comment.authorId, reputationChange);
    }

    // Get updated comment
    const updatedComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        voteList: {
          where: { userId },
          select: { type: true },
        },
      },
    });

    return {
      votes: updatedComment!.votes,
      userVote: updatedComment!.voteList[0]?.type?.toLowerCase() || null,
    };
  }
}


