import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/config/database";
import { hashPassword, comparePassword } from "@/utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "@/utils/jwt";
import { EmailService } from "./email.service";
import {
  ValidationError,
  AuthenticationError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} from "@/types";
import { Role } from "@prisma/client";
import { logger } from "@/utils/logger";

export class AuthService {
  static async register(data: {
    username: string;
    email: string;
    password: string;
  }) {
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new ConflictError("Email já está em uso");
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      throw new ConflictError("Username já está em uso");
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user with USER role
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        roles: {
          create: { role: Role.USER },
        },
      },
      include: {
        roles: true,
      },
    });

    // Generate email verification token
    const verificationToken = uuidv4();
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email (non-blocking)
    try {
      await EmailService.sendVerificationEmail(
        user.email,
        verificationToken,
        user.username
      );
    } catch (error) {
      // Log error but don't fail registration
      logger.error("Failed to send verification email:", error);
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  static async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: true,
      },
    });

    if (!user) {
      throw new AuthenticationError("Email ou password incorretos");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError("Conta desativada");
    }

    // Verify password
    if (!user.passwordHash) {
      throw new AuthenticationError("Email ou password incorretos");
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AuthenticationError("Email ou password incorretos");
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      sub: user.id,
      username: user.username,
      roles: user.roles.map((r) => r.role),
    });

    const tokenId = uuidv4();
    const refreshToken = generateRefreshToken(user.id, tokenId);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        skills: user.skills,
        reputation: user.reputation,
        level: user.level,
        roles: user.roles.map((r) => r.role),
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(token: string) {
    try {
      // verify refresh token signature/payload (result intentionally ignored)
      verifyRefreshToken(token);

      // Check if token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: { include: { roles: true } } },
      });

      if (!storedToken) {
        throw new AuthenticationError("Token inválido");
      }

      if (!storedToken.user.isActive) {
        throw new AuthenticationError("Conta desativada");
      }

      // Generate new tokens
      const accessToken = generateAccessToken({
        sub: storedToken.user.id,
        username: storedToken.user.username,
        roles: storedToken.user.roles.map((r) => r.role),
      });

      const newTokenId = uuidv4();
      const newRefreshToken = generateRefreshToken(
        storedToken.user.id,
        newTokenId
      );

      // Delete old refresh token and create new one
      await prisma.$transaction([
        prisma.refreshToken.delete({ where: { token } }),
        prisma.refreshToken.create({
          data: {
            userId: storedToken.user.id,
            token: newRefreshToken,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        }),
      ]);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new AuthenticationError("Token inválido ou expirado");
    }
  }

  static async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if email exists
    if (!user) {
      return;
    }

    // Generate reset token
    const resetToken = uuidv4();
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Send reset email (non-blocking)
    try {
      await EmailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.username
      );
    } catch (error) {
      // Log error but don't fail the password reset request
      logger.error("Failed to send password reset email:", error);
    }
  }

  static async resetPassword(token: string, newPassword: string) {
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new NotFoundError("Token inválido");
    }

    if (resetRecord.used) {
      throw new ValidationError("Token já foi utilizado");
    }

    if (resetRecord.expiresAt < new Date()) {
      throw new ValidationError("Token expirado");
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { token },
        data: { used: true },
      }),
      // Invalidate all refresh tokens for security
      prisma.refreshToken.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);
  }

  static async verifyEmail(token: string) {
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
    });

    if (!verification) {
      throw new NotFoundError("Token inválido ou já foi utilizado");
    }

    if (verification.expiresAt < new Date()) {
      throw new ValidationError("Token expirado");
    }

    // Check if user is already verified
    const user = await prisma.user.findUnique({
      where: { id: verification.userId },
      select: { isVerified: true },
    });

    if (user?.isVerified) {
      // User is already verified, just delete the token
      await prisma.emailVerification.deleteMany({
        where: { userId: verification.userId },
      });
      return; // Exit successfully
    }

    // Mark user as verified and delete token
    try {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: verification.userId },
          data: { isVerified: true },
        }),
        prisma.emailVerification.deleteMany({
          where: { userId: verification.userId },
        }),
      ]);
    } catch (error) {
      // If transaction fails, check if user was verified in a concurrent request
      const user = await prisma.user.findUnique({
        where: { id: verification.userId },
        select: { isVerified: true },
      });

      if (user?.isVerified) {
        // User was verified by another request, clean up tokens
        await prisma.emailVerification.deleteMany({
          where: { userId: verification.userId },
        });
        return; // Exit successfully
      }

      // If not verified, re-throw the error
      throw error;
    }
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("Utilizador não encontrado");
    }

    // Verificar se usuário usa OAuth (Google ou GitHub)
    if (user.provider && user.provider !== "local") {
      throw new BadRequestError(
        `Não é possível alterar a password. Você faz login via ${user.provider}.`
      );
    }

    // Verificar se tem passwordHash (usuários locais devem ter)
    if (!user.passwordHash) {
      throw new AuthenticationError(
        "Password não configurada para este utilizador"
      );
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new AuthenticationError("Password atual incorreta");
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all refresh tokens for security
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
