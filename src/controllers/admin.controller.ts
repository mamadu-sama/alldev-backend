import { Request, Response, NextFunction } from "express";
import { AdminService } from "@/services/admin.service";
import { UserService } from "@/services/user.service";
import { Role } from "@prisma/client";

export class AdminController {
  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await AdminService.getAllUsers(page, limit);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { roles } = req.body;
      const adminId = req.user!.id;

      const user = await AdminService.updateUserRole(
        adminId,
        userId,
        roles as Role[]
      );

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async banUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { reason, duration } = req.body;
      const adminId = req.user!.id;

      await AdminService.banUser(adminId, userId, reason, duration);

      res.json({
        success: true,
        message: "Utilizador banido com sucesso",
      });
    } catch (error) {
      next(error);
    }
  }

  static async unbanUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const adminId = req.user!.id;

      await AdminService.unbanUser(adminId, userId);

      res.json({
        success: true,
        message: "Ban removido com sucesso",
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const adminId = req.user!.id;

      await AdminService.deleteUser(adminId, userId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async getMaintenanceMode(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const maintenance = await AdminService.getMaintenanceMode();

      res.json({
        success: true,
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMaintenanceMode(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { isEnabled, message, endTime } = req.body;
      const adminId = req.user!.id;

      const maintenance = await AdminService.updateMaintenanceMode(
        adminId,
        isEnabled,
        message,
        endTime ? new Date(endTime) : null
      );

      res.json({
        success: true,
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRecentPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const posts = await AdminService.getRecentPosts(limit);

      res.json({
        success: true,
        data: posts,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRecentUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const users = await AdminService.getRecentUsers(limit);

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  // Posts Management
  static async getAllPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await AdminService.getAllPosts(page, limit);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const adminId = req.user!.id;

      await AdminService.deletePost(adminId, postId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async hidePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const { reason } = req.body;
      const adminId = req.user!.id;

      await AdminService.hidePost(adminId, postId, reason);

      res.json({
        success: true,
        message: "Post ocultado com sucesso",
      });
    } catch (error) {
      next(error);
    }
  }

  static async unhidePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const adminId = req.user!.id;

      await AdminService.unhidePost(adminId, postId);

      res.json({
        success: true,
        message: "Post publicado com sucesso",
      });
    } catch (error) {
      next(error);
    }
  }

  // Comments Management
  static async getAllComments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await AdminService.getAllComments(page, limit);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const adminId = req.user!.id;

      await AdminService.deleteComment(adminId, commentId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/users/:userId/reactivate
   * Reativar conta de usuário desativada
   */
  static async reactivateAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId } = req.params;

      const result = await UserService.reactivateAccount(userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
