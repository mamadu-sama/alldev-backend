import { prisma } from "@/config/database";

export class StatsService {
  /**
   * Get public community statistics
   */
  static async getCommunityStats() {
    try {
      const [totalPosts, totalUsers, resolvedPosts, todayPosts] =
        await Promise.all([
          // Total posts (não ocultos)
          prisma.post.count({
            where: { isHidden: false },
          }),

          // Total de usuários ativos
          prisma.user.count({
            where: { isActive: true },
          }),

          // Posts resolvidos (com resposta aceita)
          prisma.post.count({
            where: {
              isHidden: false,
              hasAcceptedAnswer: true,
            },
          }),

          // Posts criados hoje
          prisma.post.count({
            where: {
              isHidden: false,
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
          }),
        ]);

      return {
        totalPosts,
        totalUsers,
        resolvedPosts,
        todayPosts,
      };
    } catch (error) {
      throw error;
    }
  }
}

