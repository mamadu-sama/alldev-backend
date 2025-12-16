import { prisma } from "@/config/database";
import { logger } from "@/utils/logger";

/**
 * OnboardingService
 * Serviço responsável por gerenciar o onboarding dos usuários
 */
export class OnboardingService {
  /**
   * Verifica se o usuário completou o onboarding
   */
  static async checkOnboardingStatus(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          hasCompletedOnboarding: true,
          onboardingCompletedAt: true,
        },
      });

      if (!user) {
        throw new Error("Usuário não encontrado");
      }

      return {
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        onboardingCompletedAt: user.onboardingCompletedAt,
      };
    } catch (error) {
      logger.error("Erro ao verificar status do onboarding:", {
        userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Marca o onboarding como completo
   */
  static async completeOnboarding(userId: string) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          hasCompletedOnboarding: true,
          onboardingCompletedAt: new Date(),
        },
        select: {
          id: true,
          username: true,
          hasCompletedOnboarding: true,
          onboardingCompletedAt: true,
        },
      });

      logger.info("Onboarding completado", {
        userId: user.id,
        username: user.username,
      });

      return user;
    } catch (error) {
      logger.error("Erro ao completar onboarding:", {
        userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Reseta o onboarding (permite que o usuário veja novamente)
   */
  static async resetOnboarding(userId: string) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          hasCompletedOnboarding: false,
          onboardingCompletedAt: null,
        },
        select: {
          id: true,
          username: true,
          hasCompletedOnboarding: true,
          onboardingCompletedAt: true,
        },
      });

      logger.info("Onboarding resetado", {
        userId: user.id,
        username: user.username,
      });

      return user;
    } catch (error) {
      logger.error("Erro ao resetar onboarding:", {
        userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Pula o onboarding (usuário escolheu não fazer o tour)
   */
  static async skipOnboarding(userId: string) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          hasCompletedOnboarding: true,
          onboardingCompletedAt: new Date(),
        },
        select: {
          id: true,
          username: true,
          hasCompletedOnboarding: true,
          onboardingCompletedAt: true,
        },
      });

      logger.info("Onboarding pulado", {
        userId: user.id,
        username: user.username,
      });

      return user;
    } catch (error) {
      logger.error("Erro ao pular onboarding:", {
        userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Obtém estatísticas de onboarding (admin)
   */
  static async getOnboardingStats() {
    try {
      const [total, completed, pending] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: { hasCompletedOnboarding: true },
        }),
        prisma.user.count({
          where: { hasCompletedOnboarding: false },
        }),
      ]);

      const completionRate =
        total > 0 ? ((completed / total) * 100).toFixed(2) : "0.00";

      return {
        total,
        completed,
        pending,
        completionRate: `${completionRate}%`,
      };
    } catch (error) {
      logger.error("Erro ao obter estatísticas de onboarding:", { error });
      throw error;
    }
  }
}
