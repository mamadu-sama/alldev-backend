import { Request, Response, NextFunction } from 'express';
import { NotificationSoundService } from '@/services/notification-sound.service';
import { UploadService } from '@/services/upload.service';
import { NotificationType } from '@prisma/client';

export class NotificationSoundController {
  /**
   * Get all notification sounds
   */
  static async getAllSounds(req: Request, res: Response, next: NextFunction) {
    try {
      const { activeOnly = 'true' } = req.query;
      const sounds = await NotificationSoundService.getAllSounds(activeOnly === 'true');

      res.json({
        success: true,
        data: sounds,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sound by ID
   */
  static async getSoundById(req: Request, res: Response, next: NextFunction) {
    try {
      const { soundId } = req.params;
      const sound = await NotificationSoundService.getSoundById(soundId);

      res.json({
        success: true,
        data: sound,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload and create new sound (ADMIN only)
   */
  static async uploadSound(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { message: 'Arquivo de áudio é obrigatório' },
        });
      }

      const { name, description, isDefault = 'false' } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: { message: 'Nome do som é obrigatório' },
        });
      }

      // Upload to S3
      const { fileUrl, fileName } = await UploadService.uploadNotificationSound(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Create sound record
      const sound = await NotificationSoundService.createSound({
        name,
        description,
        fileName,
        fileUrl,
        fileSize: req.file.size,
        uploadedById: req.user!.id,
        isDefault: isDefault === 'true',
      });

      res.status(201).json({
        success: true,
        data: sound,
        message: 'Som de notificação criado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update sound (ADMIN only)
   */
  static async updateSound(req: Request, res: Response, next: NextFunction) {
    try {
      const { soundId } = req.params;
      const { name, description, isActive, isDefault } = req.body;

      const sound = await NotificationSoundService.updateSound(soundId, {
        name,
        description,
        isActive: isActive !== undefined ? isActive === true || isActive === 'true' : undefined,
        isDefault: isDefault !== undefined ? isDefault === true || isDefault === 'true' : undefined,
      });

      res.json({
        success: true,
        data: sound,
        message: 'Som atualizado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete sound (ADMIN only)
   */
  static async deleteSound(req: Request, res: Response, next: NextFunction) {
    try {
      const { soundId } = req.params;
      await NotificationSoundService.deleteSound(soundId);

      res.json({
        success: true,
        message: 'Som deletado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's sound preferences
   */
  static async getUserPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const preferences = await NotificationSoundService.getUserPreferences(userId);

      res.json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set user preference for a notification type
   */
  static async setUserPreference(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { notificationType } = req.params;
      const { soundId, useGeneratedSound } = req.body;

      // Validate notification type
      if (!Object.values(NotificationType).includes(notificationType as NotificationType)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Tipo de notificação inválido' },
        });
      }

      const preference = await NotificationSoundService.setUserPreference(
        userId,
        notificationType as NotificationType,
        {
          soundId: soundId === '' ? null : soundId,
          useGeneratedSound,
        }
      );

      res.json({
        success: true,
        data: preference,
        message: 'Preferência atualizada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Batch update user preferences
   */
  static async batchUpdatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { preferences } = req.body;

      if (!Array.isArray(preferences)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Preferências deve ser um array' },
        });
      }

      const results = await NotificationSoundService.batchUpdateUserPreferences(userId, preferences);

      res.json({
        success: true,
        data: results,
        message: 'Preferências atualizadas com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset user preferences
   */
  static async resetPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      await NotificationSoundService.resetUserPreferences(userId);

      res.json({
        success: true,
        message: 'Preferências redefinidas com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sound statistics (ADMIN only)
   */
  static async getSoundStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const { soundId } = req.params;
      const stats = await NotificationSoundService.getSoundStatistics(soundId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

