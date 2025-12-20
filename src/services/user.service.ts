import { prisma } from "@/config/database";
import { v4 as uuidv4 } from "uuid";
import { EmailService } from "./email.service";
import { UploadService } from "./upload.service";
import {
  NotFoundError,
  ConflictError,
  AuthorizationError,
  ValidationError,
  BadRequestError,
} from "@/types";
import { getPaginationParams, createPaginationMeta } from "@/utils/pagination";
import { hashPassword, comparePassword } from "@/utils/password";
import { logger } from "@/utils/logger";

export class UserService {
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        socialLinks: true,
        roles: true,
      },
    });

    if (!user) {
      throw new NotFoundError("Utilizador não encontrado");
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      coverImageUrl: user.coverImageUrl,
      bio: user.bio,
      skills: user.skills,
      socialLinks: user.socialLinks
        ? {
            github: user.socialLinks.github,
            linkedin: user.socialLinks.linkedin,
            twitter: user.socialLinks.twitter,
            portfolio: user.socialLinks.portfolio,
          }
        : null,
      reputation: user.reputation,
      level: user.level,
      isVerified: user.isVerified,
      // notificationSound and emailNotifications removed from schema
      createdAt: user.createdAt,
    };
  }

  static async updateNotificationPreferences(
    userId: string,
    data: {
      notificationSound?: boolean;
      emailNotifications?: boolean;
    }
  ) {
    // Note: notificationSound and emailNotifications fields don't exist in current schema
    // This method is kept for API compatibility but doesn't update anything
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundError("Utilizador não encontrado");
    }

    return {
      id: user.id,
      notificationSound: data.notificationSound ?? true,
      emailNotifications: data.emailNotifications ?? true,
    };
  }

  static async getNotificationPreferences(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundError("Utilizador não encontrado");
    }

    // Return defaults since fields don't exist in schema
    return {
      notificationSound: true,
      emailNotifications: true,
    };
  }

  static async updateProfile(
    userId: string,
    data: {
      username?: string;
      bio?: string;
      skills?: string[];
      socialLinks?: {
        github?: string;
        linkedin?: string;
        twitter?: string;
        portfolio?: string;
      };
    }
  ) {
    // Check if username is already taken
    if (data.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: data.username },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError("Username já está em uso");
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        username: data.username,
        bio: data.bio,
        skills: data.skills,
        socialLinks: data.socialLinks
          ? {
              upsert: {
                create: data.socialLinks,
                update: data.socialLinks,
              },
            }
          : undefined,
      },
      include: {
        socialLinks: true,
      },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      skills: user.skills,
      socialLinks: user.socialLinks,
      reputation: user.reputation,
      level: user.level,
      createdAt: user.createdAt,
    };
  }

  static async uploadAvatar(userId: string, buffer: Buffer) {
    // Get current avatar URL to delete old one
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    const avatarUrl = await UploadService.uploadAvatar(
      buffer,
      userId,
      user?.avatarUrl || undefined
    );

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return { avatarUrl };
  }

  static async deleteAvatar(userId: string) {
    await UploadService.deleteAvatar(userId);

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });
  }

  static async uploadCoverImage(userId: string, buffer: Buffer) {
    // Get current cover image URL to delete old one
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coverImageUrl: true },
    });

    const coverImageUrl = await UploadService.uploadCoverImage(
      buffer,
      userId,
      user?.coverImageUrl || undefined
    );

    await prisma.user.update({
      where: { id: userId },
      data: { coverImageUrl },
    });

    return { coverImageUrl };
  }

  static async deleteCoverImage(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coverImageUrl: true },
    });

    if (user?.coverImageUrl) {
      await UploadService.deleteCoverImage(user.coverImageUrl);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { coverImageUrl: null },
    });
  }

  static async getUserByUsername(username: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        socialLinks: true,
        _count: {
          select: {
            posts: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("Utilizador não encontrado");
    }

    // Count accepted answers
    const acceptedAnswers = await prisma.comment.count({
      where: {
        authorId: user.id,
        isAccepted: true,
      },
    });

    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      coverImageUrl: user.coverImageUrl,
      bio: user.bio,
      skills: user.skills,
      socialLinks: user.socialLinks,
      reputation: user.reputation,
      level: user.level,
      stats: {
        posts: user._count.posts,
        comments: user._count.comments,
        acceptedAnswers,
      },
      createdAt: user.createdAt,
    };
  }

  static async getUserPosts(
    username: string,
    page: number = 1,
    limit: number = 20
  ) {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundError("Utilizador não encontrado");
    }

    const { skip, take } = getPaginationParams({ page, limit });

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          authorId: user.id,
          isHidden: false,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              reputation: true,
              level: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.post.count({
        where: {
          authorId: user.id,
          isHidden: false,
        },
      }),
    ]);

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content.substring(0, 200) + "...",
      author: post.author,
      tags: post.tags.map((pt) => pt.tag),
      votes: post.votes,
      commentCount: post.commentCount,
      views: post.views,
      hasAcceptedAnswer: post.hasAcceptedAnswer,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    return {
      data: formattedPosts,
      meta: createPaginationMeta({ page, limit, total }),
    };
  }

  /**
   * Alterar senha do usuário
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    // Buscar usuário com senha
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        provider: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundError("Usuário não encontrado");
    }

    if (!user.isActive) {
      throw new AuthorizationError("Conta desativada");
    }

    // Se o usuário faz login via OAuth, bloquear alteração de senha
    if (user.provider && user.provider !== "local") {
      throw new BadRequestError(
        `Não é possível alterar a senha: login via ${user.provider}`
      );
    }

    // Verificar se passwordHash existe
    if (!user.passwordHash) {
      throw new ValidationError("Senha não configurada para este usuário");
    }

    // Verificar senha atual
    const isPasswordValid = await comparePassword(
      currentPassword,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new ValidationError("Senha atual incorreta");
    }

    // Verificar se nova senha é diferente da atual
    const isSamePassword = await comparePassword(
      newPassword,
      user.passwordHash
    );
    if (isSamePassword) {
      throw new ValidationError(
        "A nova senha deve ser diferente da senha atual"
      );
    }

    // Hash da nova senha
    const newPasswordHash = await hashPassword(newPassword);

    // Atualizar senha
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    logger.info("Senha alterada com sucesso", {
      userId: user.id,
      username: user.username,
    });

    return {
      message: "Senha alterada com sucesso",
    };
  }

  /**
   * Gerar e enviar código de confirmação para exclusão de conta
   */
  static async requestAccountDeletion(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, isActive: true },
    });

    if (!user) {
      throw new NotFoundError("Usuário não encontrado");
    }

    if (!user.isActive) {
      throw new ValidationError("Conta desativada");
    }

    const token = uuidv4();

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Log token to console to help debugging SMTP/email issues in dev
    // (visível no terminal onde o backend está rodando)
    // eslint-disable-next-line no-console
    console.log(`Account deletion token for ${user.email}: ${token}`);

    try {
      await EmailService.sendAccountDeletionEmail(
        user.email,
        token,
        user.username
      );
      logger.info("Account deletion token generated and email dispatched", {
        userId: user.id,
      });
    } catch (error) {
      logger.error("Failed to send account deletion email:", error);
      // don't throw so the endpoint remains user-friendly
    }

    return {
      message:
        "Código de confirmação enviado para o email cadastrado (se existir).",
    };
  }

  /**
   * Deletar conta do usuário (soft delete)
   */
  static async deleteAccount(
    userId: string,
    password?: string,
    token?: string
  ) {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        isActive: true,
        roles: true,
      },
    });

    if (!user) {
      throw new NotFoundError("Usuário não encontrado");
    }

    if (!user.isActive) {
      throw new ValidationError("Conta já está desativada");
    }

    // Se token foi fornecido, validar token (fluxo por email)
    if (token) {
      const resetRecord = await prisma.passwordReset.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!resetRecord) {
        throw new ValidationError("Código inválido ou expirado");
      }

      if (resetRecord.used) {
        throw new ValidationError("Código já foi utilizado");
      }

      if (resetRecord.expiresAt < new Date()) {
        throw new ValidationError("Código expirado");
      }

      if (resetRecord.userId !== user.id) {
        throw new AuthorizationError("Código não pertence a este usuário");
      }

      // marca como usado
      await prisma.passwordReset.update({
        where: { token },
        data: { used: true },
      });
    } else {
      // Verificar senha (fluxo antigo)
      if (!password) {
        throw new ValidationError("Senha é obrigatória");
      }

      if (!user.passwordHash) {
        throw new ValidationError("Senha não configurada para este usuário");
      }

      const isPasswordValid = await comparePassword(
        password,
        user.passwordHash
      );
      if (!isPasswordValid) {
        throw new ValidationError("Senha incorreta");
      }
    }

    // Verificar se é admin (não pode deletar)
    const isAdmin = user.roles.some((role) => role.role === "ADMIN");
    if (isAdmin) {
      throw new AuthorizationError(
        "Contas de administrador não podem ser deletadas. Entre em contato com o suporte."
      );
    }

    // Soft delete - desativar conta
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    logger.warn("Conta deletada (soft delete)", {
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    return {
      message: "Conta desativada com sucesso",
    };
  }

  /**
   * Reativar conta (apenas para admins)
   */
  static async reactivateAccount(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundError("Usuário não encontrado");
    }

    if (user.isActive) {
      throw new ValidationError("Conta já está ativa");
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        updatedAt: new Date(),
      },
    });

    logger.info("Conta reativada", {
      userId: user.id,
      username: user.username,
    });

    return {
      message: "Conta reativada com sucesso",
    };
  }
}
