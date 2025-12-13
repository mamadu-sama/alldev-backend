import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthenticationError, AuthorizationError } from '@/types';

export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError());
    }

    const hasRole = req.user.roles.some((role) => roles.includes(role));

    if (!hasRole) {
      return next(new AuthorizationError());
    }

    next();
  };
};

export const requireAdmin = requireRole(Role.ADMIN);
export const requireModerator = requireRole(Role.MODERATOR, Role.ADMIN);

