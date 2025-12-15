import { Request, Response, NextFunction } from 'express';
import { TagService } from '@/services/tag.service';
import { ApiResponse } from '@/types';

export class TagController {
  static async getAllTags(req: Request, res: Response, next: NextFunction) {
    try {
      const { sort, search } = req.query as any;

      const tags = await TagService.getAllTags(sort, search);

      const response: ApiResponse = {
        success: true,
        data: tags,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getTagBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;

      const tag = await TagService.getTagBySlug(slug);

      const response: ApiResponse = {
        success: true,
        data: tag,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getPostsByTag(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const userId = req.user?.id;

      const result = await TagService.getPostsByTag(
        slug,
        Number(page),
        Number(limit),
        userId
      );

      const response: ApiResponse = {
        success: true,
        data: result.posts,
        meta: {
          tag: result.tag,
          total: result.total,
          page: result.page,
          limit: result.limit,
          hasMore: result.hasMore,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async createTag(req: Request, res: Response, next: NextFunction) {
    try {
      const tag = await TagService.createTag(req.body);

      const response: ApiResponse = {
        success: true,
        data: tag,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async updateTag(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const tag = await TagService.updateTag(id, req.body);

      const response: ApiResponse = {
        success: true,
        data: tag,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async deleteTag(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await TagService.deleteTag(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

