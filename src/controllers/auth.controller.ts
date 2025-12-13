import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/auth.service';
import { ApiResponse } from '@/types';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);

      const response: ApiResponse = {
        success: true,
        data: {
          user: result,
          message: 'Registo efetuado com sucesso. Verifique o seu email.',
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await AuthService.forgotPassword(email);

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Se o email existir, receberá instruções de recuperação.',
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      await AuthService.resetPassword(token, password);

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Password alterada com sucesso.',
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      await AuthService.verifyEmail(token);

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Email verificado com sucesso.',
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      await AuthService.changePassword(req.user!.id, currentPassword, newPassword);

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Password alterada com sucesso.',
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

