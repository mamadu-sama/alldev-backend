import { Request, Response, NextFunction } from "express";
import { PrivacyPolicyService } from "@/services/privacy-policy.service";

export class PrivacyPolicyController {
  /**
   * Get privacy policy content (PUBLIC)
   */
  static async getContent(req: Request, res: Response, next: NextFunction) {
    try {
      const content = await PrivacyPolicyService.getContent();

      res.json({
        success: true,
        data: content,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get content for editing with metadata (ADMIN/MODERATOR)
   */
  static async getContentForEdit(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const content = await PrivacyPolicyService.getContentForEdit();

      res.json({
        success: true,
        data: content,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update privacy policy content (ADMIN/MODERATOR)
   */
  static async updateContent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const username = req.user!.username;
      const content = await PrivacyPolicyService.updateContent(
        req.body,
        userId,
        username
      );

      res.json({
        success: true,
        data: content,
        message: "Conteúdo da Política de Privacidade atualizado com sucesso",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get update history (ADMIN/MODERATOR)
   */
  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await PrivacyPolicyService.getHistory(page, limit);

      res.json({
        success: true,
        data: result.history,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Seed default content (ADMIN/MODERATOR)
   */
  static async seedDefault(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PrivacyPolicyService.seedDefaultContent();

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
