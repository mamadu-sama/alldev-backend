import { Request, Response, NextFunction } from "express";
import { OnboardingService } from "@/services/onboarding.service";
import { logger } from "@/utils/logger";

/**
 * OnboardingController
 * Controller responsável pelos endpoints de onboarding
 */
export class OnboardingController {
  /**
   * GET /api/onboarding/status
   * Verifica se o usuário completou o onboarding
   */
  static async getOnboardingStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.id;

      const status = await OnboardingService.checkOnboardingStatus(userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error("Erro no controller ao verificar onboarding:", { error });
      next(error);
    }
  }

  /**
   * POST /api/onboarding/complete
   * Marca o onboarding como completo
   */
  static async completeOnboarding(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.id;

      const user = await OnboardingService.completeOnboarding(userId);

      res.json({
        success: true,
        data: user,
        message: "Onboarding completado com sucesso!",
      });
    } catch (error) {
      logger.error("Erro no controller ao completar onboarding:", { error });
      next(error);
    }
  }

  /**
   * POST /api/onboarding/skip
   * Pula o onboarding
   */
  static async skipOnboarding(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const user = await OnboardingService.skipOnboarding(userId);

      res.json({
        success: true,
        data: user,
        message: "Onboarding pulado.",
      });
    } catch (error) {
      logger.error("Erro no controller ao pular onboarding:", { error });
      next(error);
    }
  }

  /**
   * POST /api/onboarding/reset
   * Reseta o onboarding para permitir que o usuário veja novamente
   */
  static async resetOnboarding(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.id;

      const user = await OnboardingService.resetOnboarding(userId);

      res.json({
        success: true,
        data: user,
        message: "Onboarding resetado. Você pode ver o tour novamente!",
      });
    } catch (error) {
      logger.error("Erro no controller ao resetar onboarding:", { error });
      next(error);
    }
  }

  /**
   * GET /api/onboarding/stats
   * Obtém estatísticas de onboarding (apenas admin)
   */
  static async getOnboardingStats(
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const stats = await OnboardingService.getOnboardingStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Erro no controller ao obter stats de onboarding:", {
        error,
      });
      next(error);
    }
  }
}
