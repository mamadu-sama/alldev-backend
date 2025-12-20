import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { AuthenticationError, AuthorizationError } from "@/types";

export const requireRole = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError());
    }

    const userRoles =
      (req.user as any).roles ??
      ((req.user as any).role ? [(req.user as any).role] : []);
    const hasRole =
      Array.isArray(userRoles) &&
      userRoles.some((role: Role) => roles.includes(role));

    if (!hasRole) {
      return next(new AuthorizationError());
    }

    next();
  };
};

export const requireAdmin = requireRole(Role.ADMIN);
export const requireModerator = requireRole(Role.MODERATOR, Role.ADMIN);
