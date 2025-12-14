import { Request, Response, NextFunction } from "express";
import { prisma } from "@/config/database";
import { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";

// Cache maintenance mode to avoid DB query on every request
let maintenanceCache: {
  isEnabled: boolean;
  message: string | null;
  endTime: Date | null;
  lastCheck: number;
} | null = null;

const CACHE_TTL = 10000; // 10 seconds

export const checkMaintenance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Always allow these routes (even in maintenance mode)
    const allowedPaths = [
      "/health",
      "/api/admin", // Admin routes
      "/api/moderator", // Moderator routes
      "/api/auth", // Auth routes (login, register, etc.)
    ];

    // Check if current path starts with any allowed path
    const isAllowedPath = allowedPaths.some(
      (path) => req.path === path || req.path.startsWith(path)
    );

    if (isAllowedPath) {
      return next();
    }

    // Get maintenance status (with cache)
    const now = Date.now();
    if (!maintenanceCache || now - maintenanceCache.lastCheck > CACHE_TTL) {
      const maintenance = await prisma.maintenanceMode.findFirst();
      maintenanceCache = maintenance
        ? {
            isEnabled: maintenance.isEnabled,
            message: maintenance.message,
            endTime: maintenance.endTime,
            lastCheck: now,
          }
        : {
            isEnabled: false,
            message: null,
            endTime: null,
            lastCheck: now,
          };
    }

    // Not in maintenance mode
    if (!maintenanceCache.isEnabled) {
      return next();
    }

    // Check if maintenance period has ended
    if (maintenanceCache.endTime && new Date() > maintenanceCache.endTime) {
      // Auto-disable maintenance mode
      await prisma.maintenanceMode.updateMany({
        data: { isEnabled: false },
      });
      maintenanceCache.isEnabled = false;
      return next();
    }

    // Try to extract and verify JWT token to check user role
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string };

        // Get user with roles
        const user = await prisma.user.findUnique({
          where: { id: decoded.sub },
          include: { roles: true },
        });

        if (user) {
          const hasAdminOrMod = user.roles.some(
            (r) => r.role === Role.ADMIN || r.role === Role.MODERATOR
          );
          if (hasAdminOrMod) {
            // Populate req.user for downstream middleware
            req.user = { id: user.id };
            return next();
          }
        }
      } catch (jwtError) {
        // Invalid token, continue to maintenance check
      }
    }

    // Return maintenance message
    return res.status(503).json({
      success: false,
      error: {
        code: "MAINTENANCE_MODE",
        message:
          maintenanceCache.message ||
          "O site está em manutenção. Voltaremos em breve.",
        endTime: maintenanceCache.endTime,
      },
    });
  } catch (error) {
    // If there's an error checking maintenance mode, allow the request through
    next();
  }
};

// Export function to clear cache (useful when toggling maintenance mode)
export const clearMaintenanceCache = () => {
  maintenanceCache = null;
};
