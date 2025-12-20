import { Request, Response, NextFunction } from "express";
import { FeatureRequestService } from "@/services/feature-request.service";
import { FeatureRequestCategory, FeatureRequestStatus } from "@prisma/client";

export class FeatureRequestController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = "votes",
        category,
        status,
      } = req.query;
      const userId = (req.user as any)?.id;

      const result = await FeatureRequestService.getAll(
        Number(page),
        Number(limit),
        sortBy as "votes" | "recent" | "comments",
        category as FeatureRequestCategory,
        status as FeatureRequestStatus
      );

      // Check which ones user has voted for
      if (userId) {
        const requestIds = result.requests.map((r) => r.id);
        const votes = await prisma.featureRequestVote.findMany({
          where: {
            featureRequestId: { in: requestIds },
            userId,
          },
          select: { featureRequestId: true },
        });

        const votedIds = new Set(votes.map((v) => v.featureRequestId));
        result.requests = result.requests.map((r) => ({
          ...r,
          hasVoted: votedIds.has(r.id),
        }));
      }

      res.json({
        success: true,
        data: result.requests,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req.user as any)?.id;

      const request = await FeatureRequestService.getById(id, userId);

      res.json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)?.id;
      const { title, description, category } = req.body;

      const request = await FeatureRequestService.create(userId, {
        title,
        description,
        category,
      });

      res.status(201).json({
        success: true,
        data: request,
        message: "Sugestão criada com sucesso!",
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleVote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req.user as any)?.id;

      const result = await FeatureRequestService.toggleVote(id, userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req.user as any)?.id;
      const { content } = req.body;

      const comment = await FeatureRequestService.addComment(
        id,
        userId,
        content
      );

      res.status(201).json({
        success: true,
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const adminId = (req.user as any)?.id;
      const { status } = req.body;

      const request = await FeatureRequestService.updateStatus(
        id,
        status,
        adminId
      );

      res.json({
        success: true,
        data: request,
        message: "Status atualizado com sucesso!",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await FeatureRequestService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Import prisma for quick vote check
import { prisma } from "@/config/database";
