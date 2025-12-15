import { Request, Response, NextFunction } from 'express';
import { ReportService } from '@/services/report.service';
import { ReportReason, ReportStatus } from '@prisma/client';

export class ReportController {
  static async createReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason, description, postId, commentId } = req.body;
      const reporterId = req.user!.id;

      const report = await ReportService.createReport(
        reporterId,
        reason as ReportReason,
        description,
        postId,
        commentId
      );

      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as ReportStatus | undefined;

      const result = await ReportService.getReports(page, limit, status);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateReportStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.params;
      const { status, resolution } = req.body;
      const reviewerId = req.user!.id;

      const report = await ReportService.updateReportStatus(
        reportId,
        reviewerId,
        status as ReportStatus,
        resolution
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
}



