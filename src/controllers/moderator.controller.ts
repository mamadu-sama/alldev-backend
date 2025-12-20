import { Request, Response, NextFunction } from "express";
import { ModeratorService } from "@/services/moderator.service";

export class ModeratorController {
  /**
   * GET /api/moderator/dashboard/stats
   * Get dashboard statistics
   */
  static async getDashboardStats(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const moderatorId = (req.user as any)?.id;
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
      const type = req.query.type as "POST" | "COMMENT" | undefined;

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
  static async getQueueStats(_req: Request, res: Response, next: NextFunction) {
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
  static async takeAction(req: Request, res: Response, next: NextFunction) {
    try {
      const moderatorId = (req.user as any)?.id;
      const actionData = req.body;

      const action = await ModeratorService.takeAction(moderatorId, actionData);

      res.status(201).json({
        success: true,
        message: "Ação de moderação executada com sucesso.",
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

  /**
   * GET /api/moderator/posts/reported
   * Get reported posts
   */
  static async getReportedPosts(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const status = req.query.status as "visible" | "hidden" | "all";

      const { data, meta } = await ModeratorService.getReportedPosts(
        page,
        limit,
        search,
        status
      );

      res.status(200).json({ success: true, data, meta });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/moderator/comments/reported
   * Get reported comments
   */
  static async getReportedComments(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const status = req.query.status as "visible" | "hidden" | "all";

      const { data, meta } = await ModeratorService.getReportedComments(
        page,
        limit,
        search,
        status
      );

      res.status(200).json({ success: true, data, meta });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/moderator/reports
   * Get all reports with filters
   */
  static async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const status = req.query.status as any;
      const type = req.query.type as "post" | "comment" | "all";

      const { data, meta } = await ModeratorService.getReports(
        page,
        limit,
        search,
        status,
        type
      );

      res.status(200).json({ success: true, data, meta });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/moderator/reports/:id/resolve
   * Resolve or dismiss a report
   */
  static async resolveReport(req: Request, res: Response, next: NextFunction) {
    try {
      const moderatorId = (req.user as any)?.id;
      const { id } = req.params;
      const { action, notes } = req.body;

      await ModeratorService.resolveReport(moderatorId, id, action, notes);

      res.status(200).json({
        success: true,
        message: `Denúncia ${
          action === "resolve"
            ? "resolvida"
            : action === "dismiss"
            ? "descartada"
            : "escalada"
        } com sucesso.`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/moderator/history
   * Get moderator's action history
   */
  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const moderatorId = (req.user as any)?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const actionType = req.query.actionType as any;

      const { data, meta, stats } = await ModeratorService.getModeratorHistory(
        moderatorId,
        page,
        limit,
        search,
        actionType
      );

      res.status(200).json({ success: true, data, meta, stats });
    } catch (error) {
      next(error);
    }
  }
}
