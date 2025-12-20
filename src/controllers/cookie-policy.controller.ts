import { Request, Response, NextFunction } from "express";
import { CookiePolicyService } from "@/services/cookie-policy.service";

export class CookiePolicyController {
  /**
   * Get cookie policy content (PUBLIC)
   */
  static async getContent(req: Request, res: Response, next: NextFunction) {
    try {
      const content = await CookiePolicyService.getContent();

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
      const content = await CookiePolicyService.getContentForEdit();

      res.json({
        success: true,
        data: content,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update cookie policy content (ADMIN/MODERATOR)
   */
  static async updateContent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).id;
      const username = (req.user as any).username;
      const content = await CookiePolicyService.updateContent(
        req.body,
        userId,
        username
      );

      res.json({
        success: true,
        data: content,
        message: "Conteúdo da Política de Cookies atualizado com sucesso",
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

      const result = await CookiePolicyService.getHistory(page, limit);

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
      const result = await CookiePolicyService.seedDefaultContent();

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
