import { Request, Response, NextFunction } from "express";
import { generateAccessToken, generateRefreshToken } from "@/utils/jwt";
import { prisma } from "@/config/database";
import { env } from "@/config/env";
import { v4 as uuidv4 } from "uuid";

export class OAuthController {
  /**
   * Iniciar autenticação com Google
   * Esta rota será interceptada pelo Passport
   */
  static async googleAuth(req: Request, res: Response, next: NextFunction) {
    // O Passport irá redirecionar automaticamente para o Google
    next();
  }

  /**
   * Callback do Google OAuth
   * Chamado após o usuário autorizar no Google
   */
  static async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;

      if (!user) {
        const frontendUrl = env.FRONTEND_URL.split(",")[0];
        return res.redirect(`${frontendUrl}/login?error=authentication_failed`);
      }

      // Mapear roles
      const roles = user.roles?.map((r: any) => r.role) || ["USER"];

      // Gerar tokens JWT
      const accessToken = generateAccessToken({
        sub: user.id,
        username: user.username,
        roles,
      });

      // Gerar um ID único para o refresh token
      const tokenId = uuidv4();
      const refreshToken = generateRefreshToken(user.id, tokenId);

      // Salvar refresh token no banco
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await prisma.refreshToken.create({
        data: {
          id: tokenId,
          userId: user.id,
          token: refreshToken,
          expiresAt,
        },
      });

      console.log(`[OAuth] Login bem-sucedido: ${user.email}`);

      // Redirecionar para frontend com tokens
      const frontendUrl = env.FRONTEND_URL.split(",")[0];
      const redirectUrl = `${frontendUrl}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}&userId=${
        user.id
      }&username=${user.username}&email=${user.email}&roles=${roles.join(
        ","
      )}&hasCompletedOnboarding=${user.hasCompletedOnboarding}&provider=${
        user.provider || "google"
      }`;

      console.log("[OAuth] Redirect URL:", redirectUrl); // ← Log para debug

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error("[OAuth] Erro no callback:", error);
      const frontendUrl = env.FRONTEND_URL.split(",")[0];
      return res.redirect(`${frontendUrl}/login?error=server_error`);
    }
  }

  /**
   * Verificar se OAuth está configurado
   */
  static async checkOAuthConfig(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const isGoogleConfigured = !!(
        env.GOOGLE_CLIENT_ID &&
        env.GOOGLE_CLIENT_SECRET &&
        env.GOOGLE_CALLBACK_URL
      );

      const isGitHubConfigured = !!(
        env.GITHUB_CLIENT_ID &&
        env.GITHUB_CLIENT_SECRET &&
        env.GITHUB_CALLBACK_URL
      );

      res.json({
        success: true,
        data: {
          google: {
            enabled: isGoogleConfigured,
            clientId: isGoogleConfigured ? env.GOOGLE_CLIENT_ID : null,
          },
          github: {
            enabled: isGitHubConfigured,
            clientId: isGitHubConfigured ? env.GITHUB_CLIENT_ID : null,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Callback do GitHub OAuth
   */
  static async githubCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;

      if (!user) {
        const frontendUrl = env.FRONTEND_URL.split(",")[0];
        return res.redirect(`${frontendUrl}/login?error=authentication_failed`);
      }

      const roles = user.roles?.map((r: any) => r.role) || ["USER"];

      const accessToken = generateAccessToken({
        sub: user.id,
        username: user.username,
        roles,
      });

      const tokenId = uuidv4();
      const refreshToken = generateRefreshToken(user.id, tokenId);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await prisma.refreshToken.create({
        data: {
          id: tokenId,
          userId: user.id,
          token: refreshToken,
          expiresAt,
        },
      });

      console.log(`[OAuth] Login GitHub bem-sucedido: ${user.email}`);

      const frontendUrl = env.FRONTEND_URL.split(",")[0];
      const redirectUrl = `${frontendUrl}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}&userId=${
        user.id
      }&username=${user.username}&email=${user.email}&roles=${roles.join(
        ","
      )}&hasCompletedOnboarding=${user.hasCompletedOnboarding}&provider=${
        user.provider || "github"
      }`;

      console.log("[OAuth] Redirect URL (GitHub):", redirectUrl);

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error("[OAuth] Erro no callback do GitHub:", error);
      const frontendUrl = env.FRONTEND_URL.split(",")[0];
      return res.redirect(`${frontendUrl}/login?error=server_error`);
    }
  }
}
