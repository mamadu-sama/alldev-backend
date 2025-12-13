import { Request, Response, NextFunction } from 'express';
import { PostService } from '@/services/post.service';
import { ApiResponse } from '@/types';

export class PostController {
  static async getPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, filter, tag, author } = req.query as any;
      const userId = req.user?.id;

      const result = await PostService.getPosts({
        page,
        limit,
        filter,
        tag,
        author,
        userId,
      });

      const response: ApiResponse = {
        success: true,
        data: result.data,
        meta: result.meta,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getPostBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const userId = req.user?.id;

      const post = await PostService.getPostBySlug(slug, userId);

      const response: ApiResponse = {
        success: true,
        data: post,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await PostService.createPost(req.body, req.user!.id);

      const response: ApiResponse = {
        success: true,
        data: post,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async updatePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const post = await PostService.updatePost(id, req.body, req.user!.id, req.user!.roles);

      const response: ApiResponse = {
        success: true,
        data: post,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await PostService.deletePost(id, req.user!.id, req.user!.roles);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

