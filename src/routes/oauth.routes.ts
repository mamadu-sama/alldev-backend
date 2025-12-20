import { Router } from "express";
import passport from "@/config/passport.config";
import { OAuthController } from "@/controllers/oauth.controller";

const router = Router();

// ============================================
// GOOGLE OAUTH ROUTES
// ============================================

/**
 * GET /oauth/google
 * Iniciar autenticação com Google
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

/**
 * GET /oauth/google/callback
 * Callback após autenticação com Google
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login?error=authentication_failed",
  }),
  OAuthController.googleCallback
);

// ============================================
// OAUTH CONFIG ROUTE
// ============================================

/**
 * GET /oauth/config
 * Verificar quais provedores OAuth estão configurados
 */
router.get("/config", OAuthController.checkOAuthConfig);

// ============================================
// GITHUB OAUTH ROUTES
// ============================================

/**
 * GET /oauth/github
 * Iniciar autenticação com GitHub
 */
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"], session: false })
);

/**
 * GET /oauth/github/callback
 * Callback após autenticação com GitHub
 */
router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "/login?error=authentication_failed",
  }),
  OAuthController.githubCallback
);

export default router;
