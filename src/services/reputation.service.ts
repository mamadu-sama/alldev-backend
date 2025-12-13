import { prisma } from '@/config/database';
import { UserLevel } from '@prisma/client';
import { logger } from '@/utils/logger';

export class ReputationService {
  private static LEVELS: { level: UserLevel; minRep: number }[] = [
    { level: 'GURU', minRep: 1000 },
    { level: 'EXPERT', minRep: 500 },
    { level: 'CONTRIBUIDOR', minRep: 100 },
    { level: 'NOVATO', minRep: 0 },
  ];

  static async updateReputation(userId: string, change: number): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      logger.warn(`Attempted to update reputation for non-existent user: ${userId}`);
      return;
    }

    const newReputation = Math.max(0, user.reputation + change); // Minimum 0

    // Update reputation
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { reputation: newReputation },
    });

    // Check if level changed
    const newLevel = this.calculateLevel(newReputation);
    if (newLevel !== updatedUser.level) {
      await prisma.user.update({
        where: { id: userId },
        data: { level: newLevel },
      });

      logger.info(`User ${user.username} leveled up to ${newLevel}`, {
        userId,
        oldLevel: user.level,
        newLevel,
        reputation: newReputation,
      });
    }
  }

  static calculateLevel(reputation: number): UserLevel {
    for (const { level, minRep } of this.LEVELS) {
      if (reputation >= minRep) {
        return level;
      }
    }
    return 'NOVATO';
  }

  static getPointsForAction(action: string): number {
    const points: Record<string, number> = {
      UPVOTE_POST: 10,
      DOWNVOTE_POST: -2,
      UPVOTE_COMMENT: 5,
      DOWNVOTE_COMMENT: -1,
      ACCEPTED_ANSWER: 25,
      ACCEPT_ANSWER: 2,
    };
    return points[action] || 0;
  }
}


