import { Request, Response, NextFunction } from 'express';
import { VoteService } from '@/services/vote.service';

export class VoteController {
  static async vote(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, postId, commentId } = req.body;
      const userId = req.user!.id;

      const result = await VoteService.vote(userId, type, postId, commentId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}


