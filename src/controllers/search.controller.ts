import { Request, Response, NextFunction } from 'express';
import { SearchService } from '@/services/search.service';

export class SearchController {
  static async searchGlobal(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const userId = req.user?.id;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parâmetro de pesquisa "q" é obrigatório',
          },
        });
      }

      const result = await SearchService.searchGlobal(q, page, limit, userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async searchPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, tag } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const userId = req.user?.id;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parâmetro de pesquisa "q" é obrigatório',
          },
        });
      }

      const result = await SearchService.searchPosts(q, page, limit, userId, tag as string);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async autocomplete(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, type } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parâmetro de pesquisa "q" é obrigatório',
          },
        });
      }

      const validType = type === 'users' ? 'users' : 'tags';
      const result = await SearchService.autocomplete(q, validType);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}



