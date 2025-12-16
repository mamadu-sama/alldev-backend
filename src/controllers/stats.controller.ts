import { Request, Response, NextFunction } from "express";
import { StatsService } from "@/services/stats.service";
import { ApiResponse } from "@/types";

export class StatsController {
  static async getCommunityStats(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const stats = await StatsService.getCommunityStats();

      const response: ApiResponse = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
