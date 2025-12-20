import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '@/services/settings.service';

export class SettingsController {
  static async getSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getSettings();

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.id;
      const data = req.body;

      const settings = await SettingsService.updateSettings(adminId, data);

      res.json({
        success: true,
        data: settings,
        message: 'Configurações atualizadas com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}

