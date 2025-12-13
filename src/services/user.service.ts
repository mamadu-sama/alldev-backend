import { prisma } from '@/config/database';
import { UploadService } from './upload.service';
import { NotFoundError, ConflictError, AuthorizationError } from '@/types';
import { getPaginationParams, createPaginationMeta } from '@/utils/pagination';

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
      throw new NotFoundError('Utilizador não encontrado');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
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
      createdAt: user.createdAt,
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
        throw new ConflictError('Username já está em uso');
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
    const avatarUrl = await UploadService.uploadAvatar(buffer, userId);

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
      throw new NotFoundError('Utilizador não encontrado');
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

  static async getUserPosts(username: string, page: number = 1, limit: number = 20) {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundError('Utilizador não encontrado');
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
        orderBy: { createdAt: 'desc' },
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
      content: post.content.substring(0, 200) + '...',
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
      meta: createPaginationMeta(page, limit, total),
    };
  }
}

