import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

export class SettingsService {
  static async getSettings() {
    // Get or create settings (singleton pattern)
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.settings.create({
        data: {},
      });
    }

    return settings;
  }

  static async updateSettings(adminId: string, data: Record<string, any>) {
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      // Create if doesn't exist
      settings = await prisma.settings.create({
        data: {
          ...data,
          updatedBy: adminId,
        },
      });
    } else {
      // Update existing
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          ...data,
          updatedBy: adminId,
        },
      });
    }

    logger.info('Settings updated by admin', {
      adminId,
      changes: Object.keys(data),
    });

    return settings;
  }
}

