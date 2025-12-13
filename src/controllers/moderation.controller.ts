import { Request, Response, NextFunction } from 'express';
import { ModerationService } from '@/services/moderation.service';

export class ModerationController {
  static async hidePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const { reason } = req.body;
      const moderatorId = req.user!.id;

      await ModerationService.hidePost(postId, moderatorId, reason);

      res.json({
        success: true,
        message: 'Post ocultado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  static async unhidePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const moderatorId = req.user!.id;

      await ModerationService.unhidePost(postId, moderatorId);

      res.json({
        success: true,
        message: 'Post restaurado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  static async lockPost(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const { reason } = req.body;
      const moderatorId = req.user!.id;

      await ModerationService.lockPost(postId, moderatorId, reason);

      res.json({
        success: true,
        message: 'Post bloqueado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  static async unlockPost(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const moderatorId = req.user!.id;

      await ModerationService.unlockPost(postId, moderatorId);

      res.json({
        success: true,
        message: 'Post desbloqueado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  static async hideComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const { reason } = req.body;
      const moderatorId = req.user!.id;

      await ModerationService.hideComment(commentId, moderatorId, reason);

      res.json({
        success: true,
        message: 'Comentário ocultado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  static async unhideComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const moderatorId = req.user!.id;

      await ModerationService.unhideComment(commentId, moderatorId);

      res.json({
        success: true,
        message: 'Comentário restaurado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getModerationActions(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await ModerationService.getModerationActions(page, limit);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }
}


