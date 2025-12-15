import { prisma } from '@/config/database';
import { getPaginationParams, createPaginationMeta } from '@/utils/pagination';

export class SearchService {
  static async searchGlobal(query: string, page: number = 1, limit: number = 20, userId?: string) {
    if (!query || query.trim().length < 2) {
      return {
        posts: [],
        tags: [],
        users: [],
        meta: createPaginationMeta(page, limit, 0),
      };
    }

    const searchQuery = query.trim().toLowerCase();
    const { skip, take } = getPaginationParams({ page, limit });

    // Search posts (title, content)
    const [posts, postsTotal] = await Promise.all([
      prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { content: { contains: searchQuery, mode: 'insensitive' } },
          ],
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
          voteList: userId
            ? {
                where: { userId },
                select: { type: true },
              }
            : false,
        },
        orderBy: [{ votes: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      prisma.post.count({
        where: {
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { content: { contains: searchQuery, mode: 'insensitive' } },
          ],
          isHidden: false,
        },
      }),
    ]);

    // Search tags (name, description)
    const tags = await prisma.tag.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      orderBy: { postCount: 'desc' },
      take: 10,
    });

    // Search users (username, bio)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: searchQuery, mode: 'insensitive' } },
          { bio: { contains: searchQuery, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        reputation: true,
        level: true,
      },
      orderBy: { reputation: 'desc' },
      take: 10,
    });

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content.substring(0, 200) + '...', // Preview
      slug: post.slug,
      author: post.author,
      tags: post.tags.map((pt) => pt.tag),
      votes: post.votes,
      userVote: post.voteList?.[0]?.type?.toLowerCase() || null,
      commentCount: post.commentCount,
      hasAcceptedAnswer: post.hasAcceptedAnswer,
      views: post.views,
      createdAt: post.createdAt,
    }));

    return {
      posts: formattedPosts,
      tags,
      users,
      meta: createPaginationMeta(page, limit, postsTotal),
    };
  }

  static async searchPosts(
    query: string,
    page: number = 1,
    limit: number = 20,
    userId?: string,
    tagSlug?: string
  ) {
    if (!query || query.trim().length < 2) {
      return {
        data: [],
        meta: createPaginationMeta(page, limit, 0),
      };
    }

    const searchQuery = query.trim().toLowerCase();
    const { skip, take } = getPaginationParams({ page, limit });

    const where: any = {
      OR: [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { content: { contains: searchQuery, mode: 'insensitive' } },
      ],
      isHidden: false,
    };

    // Filter by tag if provided
    if (tagSlug) {
      where.tags = {
        some: {
          tag: {
            slug: tagSlug,
          },
        },
      };
    }

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
        orderBy: [{ votes: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      prisma.post.count({ where }),
    ]);

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content.substring(0, 200) + '...',
      slug: post.slug,
      author: post.author,
      tags: post.tags.map((pt) => pt.tag),
      votes: post.votes,
      userVote: post.voteList?.[0]?.type?.toLowerCase() || null,
      commentCount: post.commentCount,
      hasAcceptedAnswer: post.hasAcceptedAnswer,
      views: post.views,
      createdAt: post.createdAt,
    }));

    return {
      data: formattedPosts,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  static async autocomplete(query: string, type: 'tags' | 'users' = 'tags') {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchQuery = query.trim().toLowerCase();

    if (type === 'tags') {
      return await prisma.tag.findMany({
        where: {
          name: { contains: searchQuery, mode: 'insensitive' },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          postCount: true,
        },
        orderBy: { postCount: 'desc' },
        take: 10,
      });
    } else {
      return await prisma.user.findMany({
        where: {
          username: { contains: searchQuery, mode: 'insensitive' },
          isActive: true,
        },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          reputation: true,
          level: true,
        },
        orderBy: { reputation: 'desc' },
        take: 10,
      });
    }
  }
}



