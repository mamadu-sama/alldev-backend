import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database';

export class PostRepository {
  static async create(data: Prisma.PostCreateInput) {
    return await prisma.post.create({ data });
  }

  static async findBySlug(slug: string, userId?: string) {
    const post = await prisma.post.findUnique({
      where: { slug },
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
        voteList: userId
          ? {
              where: { userId },
              select: { type: true },
            }
          : false,
      },
    });

    if (!post) return null;

    return {
      ...post,
      tags: post.tags.map((pt) => pt.tag),
      userVote: post.voteList?.[0]?.type?.toLowerCase() || null,
      voteList: undefined,
    };
  }

  static async update(id: string, data: Prisma.PostUpdateInput) {
    return await prisma.post.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return await prisma.post.delete({
      where: { id },
    });
  }

  static async incrementViews(id: string) {
    return await prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  }
}

