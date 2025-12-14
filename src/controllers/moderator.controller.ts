import { Request, Response, NextFunction } from 'express';
import { ModeratorService } from '@/services/moderator.service';
import { AuthenticatedRequest } from '@/types';

export class ModeratorController {
  /**
   * GET /api/moderator/dashboard/stats
   * Get dashboard statistics
   */
  static async getDashboardStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const moderatorId = req.user!.id;
      const stats = await ModeratorService.getDashboardStats(moderatorId);

      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/moderator/queue
   * Get moderation queue
   */
  static async getQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const priority = req.query.priority as string;
      const type = req.query.type as 'POST' | 'COMMENT' | undefined;

      const { data, meta } = await ModeratorService.getQueue(
        page,
        limit,
        priority,
        type
      );

      res.status(200).json({ success: true, data, meta });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/moderator/queue/stats
   * Get queue statistics
   */
  static async getQueueStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await ModeratorService.getQueueStats();

      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/moderator/actions
   * Take moderation action
   */
  static async takeAction(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const moderatorId = req.user!.id;
      const actionData = req.body;

      const action = await ModeratorService.takeAction(moderatorId, actionData);

      res.status(201).json({
        success: true,
        message: 'Ação de moderação executada com sucesso.',
        data: action,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/moderator/queue/recent
   * Get recent queue items (for dashboard)
   */
  static async getRecentQueueItems(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const items = await ModeratorService.getRecentQueueItems(limit);

      res.status(200).json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }
}

