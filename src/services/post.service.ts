import { prisma } from '@/config/database';
import { PostRepository } from '@/repositories/post.repository';
import { generateUniqueSlug } from '@/utils/slug';
import { getPaginationParams, createPaginationMeta } from '@/utils/pagination';
import { NotFoundError, AuthorizationError } from '@/types';

interface GetPostsParams {
  page?: number;
  limit?: number;
  filter?: 'recent' | 'votes' | 'unanswered';
  tag?: string;
  author?: string;
  userId?: string;
}

export class PostService {
  static async getPosts(params: GetPostsParams) {
    const { page = 1, limit = 20, filter = 'recent', tag, author, userId } = params;
    const { skip, take } = getPaginationParams({ page, limit });

    const where: any = {
      isHidden: false,
    };

    if (filter === 'unanswered') {
      where.hasAcceptedAnswer = false;
    }

    if (tag) {
      where.tags = {
        some: {
          tag: { slug: tag },
        },
      };
    }

    if (author) {
      where.author = { username: author };
    }

    const orderBy: any = [];
    if (filter === 'votes') {
      orderBy.push({ votes: 'desc' });
    }
    orderBy.push({ createdAt: 'desc' });

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
        orderBy,
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

  static async getPostBySlug(slug: string, userId?: string) {
    const post = await PostRepository.findBySlug(slug, userId);

    if (!post) {
      throw new NotFoundError('Post não encontrado');
    }

    // Increment views
    await PostRepository.incrementViews(post.id);

    return post;
  }

  static async createPost(
    data: {
      title: string;
      content: string;
      tagIds: string[];
    },
    authorId: string
  ) {
    // Generate unique slug
    const slug = await generateUniqueSlug(data.title, 'post');

    // Verify tags exist
    const tags = await prisma.tag.findMany({
      where: { id: { in: data.tagIds } },
    });

    if (tags.length !== data.tagIds.length) {
      throw new NotFoundError('Uma ou mais tags não foram encontradas');
    }

    // Create post in transaction
    const post = await prisma.$transaction(async (tx) => {
      const newPost = await tx.post.create({
        data: {
          title: data.title,
          content: data.content,
          slug,
          authorId,
          tags: {
            create: data.tagIds.map((tagId) => ({
              tagId,
            })),
          },
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
              tag: true,
            },
          },
        },
      });

      // Increment post count for all tags
      await tx.tag.updateMany({
        where: { id: { in: data.tagIds } },
        data: { postCount: { increment: 1 } },
      });

      return newPost;
    });

    return {
      ...post,
      tags: post.tags.map((pt) => pt.tag),
    };
  }

  static async updatePost(
    postId: string,
    data: {
      title?: string;
      content?: string;
      tagIds?: string[];
    },
    userId: string,
    userRoles: string[]
  ) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { tags: true },
    });

    if (!post) {
      throw new NotFoundError('Post não encontrado');
    }

    // Check authorization
    const isAuthor = post.authorId === userId;
    const isAdmin = userRoles.includes('ADMIN');

    if (!isAuthor && !isAdmin) {
      throw new AuthorizationError();
    }

    let slug = post.slug;
    if (data.title && data.title !== post.title) {
      slug = await generateUniqueSlug(data.title, 'post');
    }

    // Update post
    const updated = await prisma.$transaction(async (tx) => {
      // If tags are being updated
      if (data.tagIds) {
        // Verify new tags exist
        const newTags = await tx.tag.findMany({
          where: { id: { in: data.tagIds } },
        });

        if (newTags.length !== data.tagIds.length) {
          throw new NotFoundError('Uma ou mais tags não foram encontradas');
        }

        // Get old tag IDs
        const oldTagIds = post.tags.map((pt) => pt.tagId);

        // Remove old tags
        await tx.postTag.deleteMany({
          where: { postId },
        });

        // Decrement count for old tags
        await tx.tag.updateMany({
          where: { id: { in: oldTagIds } },
          data: { postCount: { decrement: 1 } },
        });

        // Add new tags
        await tx.postTag.createMany({
          data: data.tagIds.map((tagId) => ({
            postId,
            tagId,
          })),
        });

        // Increment count for new tags
        await tx.tag.updateMany({
          where: { id: { in: data.tagIds } },
          data: { postCount: { increment: 1 } },
        });
      }

      return await tx.post.update({
        where: { id: postId },
        data: {
          title: data.title,
          content: data.content,
          slug,
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
              tag: true,
            },
          },
        },
      });
    });

    return {
      ...updated,
      tags: updated.tags.map((pt) => pt.tag),
    };
  }

  static async deletePost(postId: string, userId: string, userRoles: string[]) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { tags: true },
    });

    if (!post) {
      throw new NotFoundError('Post não encontrado');
    }

    // Check authorization
    const isAuthor = post.authorId === userId;
    const isAdmin = userRoles.includes('ADMIN');

    if (!isAuthor && !isAdmin) {
      throw new AuthorizationError();
    }

    await prisma.$transaction(async (tx) => {
      // Decrement tag counts
      const tagIds = post.tags.map((pt) => pt.tagId);
      await tx.tag.updateMany({
        where: { id: { in: tagIds } },
        data: { postCount: { decrement: 1 } },
      });

      // Delete post (cascades to tags, comments, votes)
      await tx.post.delete({
        where: { id: postId },
      });
    });
  }
}

