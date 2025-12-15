import { prisma } from '@/config/database';
import { generateUniqueSlug } from '@/utils/slug';
import { NotFoundError, ValidationError } from '@/types';

export class TagService {
  static async getAllTags(sort: 'popular' | 'alphabetical' = 'popular', search?: string) {
    const where: any = search
      ? {
          OR: [{ name: { contains: search, mode: 'insensitive' } }],
        }
      : {};

    const orderBy: any = sort === 'popular' ? { postCount: 'desc' } : { name: 'asc' };

    const tags = await prisma.tag.findMany({
      where,
      orderBy,
    });

    return tags;
  }

  static async getTagBySlug(slug: string) {
    const tag = await prisma.tag.findUnique({
      where: { slug },
    });

    if (!tag) {
      throw new NotFoundError('Tag não encontrada');
    }

    return tag;
  }

  static async getPostsByTag(slug: string, page: number = 1, limit: number = 20, userId?: string) {
    try {
      const tag = await this.getTagBySlug(slug);

      const skip = (page - 1) * limit;

      const where = {
        isHidden: false,
        tags: {
          some: {
            tag: { slug },
          },
        },
      };

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
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
                tag: true,
              },
            },
            voteList: userId
              ? {
                  where: { userId },
                  select: { type: true },
                }
              : false,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.post.count({ where }),
      ]);

      const formattedPosts = posts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        votes: post.votes,
        views: post.views,
        commentCount: post.commentCount,
        hasAcceptedAnswer: post.hasAcceptedAnswer,
        isLocked: post.isLocked,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.author,
        tags: post.tags.map((pt) => pt.tag),
        userVote: post.voteList && post.voteList.length > 0 ? post.voteList[0].type.toLowerCase() : null,
      }));

      return {
        tag,
        posts: formattedPosts,
        total,
        page,
        limit,
        hasMore: skip + posts.length < total,
      };
    } catch (error) {
      throw error;
    }
  }

  static async createTag(data: { name: string; description?: string }) {
    // Check if tag with same name exists
    const existing = await prisma.tag.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new ValidationError('Tag com este nome já existe');
    }

    const slug = await generateUniqueSlug(data.name, 'tag');

    const tag = await prisma.tag.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
      },
    });

    return tag;
  }

  static async updateTag(id: string, data: { name?: string; description?: string }) {
    const tag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundError('Tag não encontrada');
    }

    // If name is being updated, check uniqueness and regenerate slug
    let slug = tag.slug;
    if (data.name && data.name !== tag.name) {
      const existing = await prisma.tag.findUnique({
        where: { name: data.name },
      });

      if (existing) {
        throw new ValidationError('Tag com este nome já existe');
      }

      slug = await generateUniqueSlug(data.name, 'tag');
    }

    const updated = await prisma.tag.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.name ? slug : undefined,
        description: data.description,
      },
    });

    return updated;
  }

  static async deleteTag(id: string) {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!tag) {
      throw new NotFoundError('Tag não encontrada');
    }

    if (tag._count.posts > 0) {
      throw new ValidationError('Não é possível eliminar tag com posts associados');
    }

    await prisma.tag.delete({
      where: { id },
    });
  }
}

