import { Router } from "express";
import { OnboardingController } from "@/controllers/onboarding.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";

const router = Router();

/**
 * Todas as rotas de onboarding requerem autenticação
 */
router.use(authenticate);

/**
 * GET /api/onboarding/status
 * Verifica se o usuário completou o onboarding
 */
router.get("/status", OnboardingController.getOnboardingStatus);

/**
 * POST /api/onboarding/complete
 * Marca o onboarding como completo
 */
router.post("/complete", OnboardingController.completeOnboarding);

/**
 * POST /api/onboarding/skip
 * Pula o onboarding
 */
router.post("/skip", OnboardingController.skipOnboarding);

/**
 * POST /api/onboarding/reset
 * Reseta o onboarding (usuário pode ver novamente)
 */
router.post("/reset", OnboardingController.resetOnboarding);

/**
 * GET /api/onboarding/stats
 * Obtém estatísticas de onboarding (apenas admin)
 */
router.get(
  "/stats",
  requireRole(["ADMIN"]),
  OnboardingController.getOnboardingStats
);

export default router;
