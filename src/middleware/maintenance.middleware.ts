import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { Role } from '@prisma/client';

export const checkMaintenance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Skip check for health endpoint
    if (req.path === '/health') {
      return next();
    }

    const maintenance = await prisma.maintenanceMode.findFirst();

    if (!maintenance || !maintenance.isActive) {
      return next();
    }

    // Check if user has allowed role
    if (req.user) {
      const userRoles = req.user.roles as Role[];
      const hasAllowedRole = userRoles.some((role) =>
        maintenance.allowedRoles.includes(role)
      );

      if (hasAllowedRole) {
        return next();
      }
    }

    // Return maintenance message
    return res.status(503).json({
      success: false,
      error: {
        code: 'MAINTENANCE_MODE',
        message: maintenance.message || 'O site está em manutenção. Voltaremos em breve.',
      },
    });
  } catch (error) {
    // If there's an error checking maintenance mode, allow the request through
    next();
  }
};


