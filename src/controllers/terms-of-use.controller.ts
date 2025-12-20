import { Request, Response, NextFunction } from "express";
import { TermsOfUseService } from "@/services/terms-of-use.service";

export class TermsOfUseController {
  /**
   * Get terms of use content (PUBLIC)
   */
  static async getContent(req: Request, res: Response, next: NextFunction) {
    try {
      const content = await TermsOfUseService.getContent();

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
      const content = await TermsOfUseService.getContentForEdit();

      res.json({
        success: true,
        data: content,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update terms of use content (ADMIN/MODERATOR)
   */
  static async updateContent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const username = req.user!.username;
      const content = await TermsOfUseService.updateContent(
        req.body,
        userId,
        username
      );

      res.json({
        success: true,
        data: content,
        message: "Conteúdo dos Termos de Uso atualizado com sucesso",
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

      const result = await TermsOfUseService.getHistory(page, limit);

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
      const result = await TermsOfUseService.seedDefaultContent();

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
