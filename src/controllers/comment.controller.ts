import { Request, Response, NextFunction } from 'express';
import { CommentService } from '@/services/comment.service';

export class CommentController {
  static async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const userId = req.user?.id;

      const result = await CommentService.getCommentsByPost(postId, page, limit, userId);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const { content, parentId } = req.body;
      const authorId = req.user!.id;

      const comment = await CommentService.createComment(postId, authorId, content, parentId);

      res.status(201).json({
        success: true,
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user!.id;
      const userRoles = req.user!.roles;

      const comment = await CommentService.updateComment(commentId, content, userId, userRoles);

      res.json({
        success: true,
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const userId = req.user!.id;
      const userRoles = req.user!.roles;

      await CommentService.deleteComment(commentId, userId, userRoles);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async acceptComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const postAuthorId = req.user!.id;

      const comment = await CommentService.acceptComment(commentId, postAuthorId);

      res.json({
        success: true,
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }
}


