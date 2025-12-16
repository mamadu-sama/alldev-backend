import { Request, Response, NextFunction } from 'express';
import { UserService } from '@/services/user.service';
import { ApiResponse } from '@/types';

export class UserController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getProfile(req.user!.id);

      const response: ApiResponse = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.updateProfile(req.user!.id, req.body);

      const response: ApiResponse = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_REQUIRED',
            message: 'Nenhum ficheiro enviado',
          },
        });
      }

      const result = await UserService.uploadAvatar(req.user!.id, req.file.buffer);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      await UserService.deleteAvatar(req.user!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async uploadCoverImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_REQUIRED',
            message: 'Nenhum ficheiro enviado',
          },
        });
      }

      const result = await UserService.uploadCoverImage(req.user!.id, req.file.buffer);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async deleteCoverImage(req: Request, res: Response, next: NextFunction) {
    try {
      await UserService.deleteCoverImage(req.user!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async getUserByUsername(req: Request, res: Response, next: NextFunction) {
    try {
      const { username } = req.params;
      const user = await UserService.getUserByUsername(username);

      const response: ApiResponse = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getUserPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const { username } = req.params;
      const { page, limit } = req.query as { page?: number; limit?: number };

      const result = await UserService.getUserPosts(username, page, limit);

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

  static async getNotificationPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const preferences = await UserService.getNotificationPreferences(req.user!.id);

      const response: ApiResponse = {
        success: true,
        data: preferences,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async updateNotificationPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const preferences = await UserService.updateNotificationPreferences(req.user!.id, req.body);

      const response: ApiResponse = {
        success: true,
        data: preferences,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

