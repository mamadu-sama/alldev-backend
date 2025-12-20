import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/utils/jwt";
import { prisma } from "@/config/database";
import { AuthenticationError } from "@/types";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("Token não fornecido");
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    // Fetch user with roles
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: true },
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError("Utilizador inválido ou inativo");
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles.map((r) => r.role),
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const payload = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: { roles: true },
      });

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          roles: user.roles.map((r) => r.role),
        };
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};
