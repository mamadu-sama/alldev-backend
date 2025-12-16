import { prisma } from '@/config/database';
import { NotificationType } from '@prisma/client';
import { logger } from '@/utils/logger';

export class NotificationSoundService {
  /**
   * Get all available notification sounds
   */
  static async getAllSounds(activeOnly: boolean = false) {
    try {
      const where = activeOnly ? { isActive: true } : {};

      const sounds = await prisma.notificationSound.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              userPreferences: true,
            },
          },
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return sounds;
    } catch (error) {
      logger.error('Error fetching notification sounds', { error });
      throw error;
    }
  }

  /**
   * Get sound by ID
   */
  static async getSoundById(soundId: string) {
    try {
      const sound = await prisma.notificationSound.findUnique({
        where: { id: soundId },
        include: {
          uploadedBy: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      if (!sound) {
        throw new Error('Som de notificação não encontrado');
      }

      return sound;
    } catch (error) {
      logger.error('Error fetching sound by ID', { error, soundId });
      throw error;
    }
  }

  /**
   * Create a new notification sound
   */
  static async createSound(data: {
    name: string;
    description?: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    duration?: number;
    uploadedById: string;
    isDefault?: boolean;
  }) {
    try {
      // If setting as default, unset other defaults
      if (data.isDefault) {
        await prisma.notificationSound.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const sound = await prisma.notificationSound.create({
        data: {
          name: data.name,
          description: data.description,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
          duration: data.duration,
          uploadedById: data.uploadedById,
          isDefault: data.isDefault || false,
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      logger.info('Notification sound created', { soundId: sound.id, name: sound.name });
      return sound;
    } catch (error) {
      logger.error('Error creating notification sound', { error, data });
      throw error;
    }
  }

  /**
   * Update notification sound
   */
  static async updateSound(
    soundId: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      isDefault?: boolean;
    }
  ) {
    try {
      // If setting as default, unset other defaults
      if (data.isDefault) {
        await prisma.notificationSound.updateMany({
          where: { isDefault: true, id: { not: soundId } },
          data: { isDefault: false },
        });
      }

      const sound = await prisma.notificationSound.update({
        where: { id: soundId },
        data,
        include: {
          uploadedBy: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      logger.info('Notification sound updated', { soundId, data });
      return sound;
    } catch (error) {
      logger.error('Error updating notification sound', { error, soundId, data });
      throw error;
    }
  }

  /**
   * Delete notification sound
   */
  static async deleteSound(soundId: string) {
    try {
      const sound = await prisma.notificationSound.findUnique({
        where: { id: soundId },
      });

      if (!sound) {
        throw new Error('Som de notificação não encontrado');
      }

      // Delete file from S3
      try {
        const { UploadService } = await import('./upload.service');
        await UploadService.deleteNotificationSound(sound.fileUrl);
      } catch (fileError) {
        logger.warn('Could not delete sound file from S3', { fileUrl: sound.fileUrl, fileError });
      }

      // Delete from database
      await prisma.notificationSound.delete({
        where: { id: soundId },
      });

      logger.info('Notification sound deleted', { soundId, fileName: sound.fileName });
      return { success: true };
    } catch (error) {
      logger.error('Error deleting notification sound', { error, soundId });
      throw error;
    }
  }

  /**
   * Get user sound preferences
   */
  static async getUserPreferences(userId: string) {
    try {
      const preferences = await prisma.userNotificationSoundPreference.findMany({
        where: { userId },
        include: {
          sound: true,
        },
      });

      // Create map of type -> preference
      const preferencesMap: Record<string, any> = {};
      preferences.forEach((pref) => {
        preferencesMap[pref.notificationType] = {
          soundId: pref.soundId,
          useGeneratedSound: pref.useGeneratedSound,
          sound: pref.sound,
        };
      });

      return preferencesMap;
    } catch (error) {
      logger.error('Error fetching user sound preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Set user preference for a notification type
   */
  static async setUserPreference(
    userId: string,
    notificationType: NotificationType,
    data: {
      soundId?: string | null;
      useGeneratedSound?: boolean;
    }
  ) {
    try {
      // Validate sound exists if provided
      if (data.soundId) {
        const sound = await prisma.notificationSound.findUnique({
          where: { id: data.soundId },
        });

        if (!sound || !sound.isActive) {
          throw new Error('Som de notificação inválido ou inativo');
        }
      }

      const preference = await prisma.userNotificationSoundPreference.upsert({
        where: {
          userId_notificationType: {
            userId,
            notificationType,
          },
        },
        update: {
          soundId: data.soundId === null ? null : data.soundId,
          useGeneratedSound: data.useGeneratedSound ?? false,
        },
        create: {
          userId,
          notificationType,
          soundId: data.soundId,
          useGeneratedSound: data.useGeneratedSound ?? false,
        },
        include: {
          sound: true,
        },
      });

      logger.info('User sound preference updated', { userId, notificationType, data });
      return preference;
    } catch (error) {
      logger.error('Error setting user sound preference', { error, userId, notificationType, data });
      throw error;
    }
  }

  /**
   * Batch update user preferences
   */
  static async batchUpdateUserPreferences(
    userId: string,
    preferences: Array<{
      notificationType: NotificationType;
      soundId?: string | null;
      useGeneratedSound?: boolean;
    }>
  ) {
    try {
      const results = await Promise.all(
        preferences.map((pref) =>
          this.setUserPreference(userId, pref.notificationType, {
            soundId: pref.soundId,
            useGeneratedSound: pref.useGeneratedSound,
          })
        )
      );

      return results;
    } catch (error) {
      logger.error('Error batch updating user preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Reset user preferences to default
   */
  static async resetUserPreferences(userId: string) {
    try {
      await prisma.userNotificationSoundPreference.deleteMany({
        where: { userId },
      });

      logger.info('User sound preferences reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Error resetting user preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Get sound statistics
   */
  static async getSoundStatistics(soundId: string) {
    try {
      const [sound, usageCount, preferencesByType] = await Promise.all([
        prisma.notificationSound.findUnique({
          where: { id: soundId },
        }),
        prisma.userNotificationSoundPreference.count({
          where: { soundId },
        }),
        prisma.userNotificationSoundPreference.groupBy({
          by: ['notificationType'],
          where: { soundId },
          _count: true,
        }),
      ]);

      if (!sound) {
        throw new Error('Som não encontrado');
      }

      return {
        sound,
        totalUsers: usageCount,
        usageByType: preferencesByType.reduce((acc, item) => {
          acc[item.notificationType] = item._count;
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      logger.error('Error fetching sound statistics', { error, soundId });
      throw error;
    }
  }
}

