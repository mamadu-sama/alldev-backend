import { prisma } from "@/config/database";
import { PostRepository } from "@/repositories/post.repository";
import { generateUniqueSlug } from "@/utils/slug";
import { getPaginationParams, createPaginationMeta } from "@/utils/pagination";
import { NotFoundError, AuthorizationError } from "@/types";

interface GetPostsParams {
  page?: number;
  limit?: number;
  filter?: "recent" | "votes" | "unanswered";
  tag?: string;
  author?: string;
  userId?: string;
}

export class PostService {
  static async getPosts(params: GetPostsParams) {
    const {
      page = 1,
      limit = 20,
      filter = "recent",
      tag,
      author,
      userId,
    } = params;
    const { skip, take } = getPaginationParams({ page, limit });

    const where: any = {
      isHidden: false,
    };

    if (filter === "unanswered") {
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
    if (filter === "votes") {
      orderBy.push({ votes: "desc" });
    }
    orderBy.push({ createdAt: "desc" });

    // If user is authenticated, prioritize posts from followed tags
    let posts: any[];
    let total: number;

    if (userId && filter === "recent" && !tag && !author) {
      // Get user's followed tags
      const followedTags = await prisma.userTagFollow.findMany({
        where: { userId },
        select: { tagId: true },
      });

      const followedTagIds = followedTags.map((ft) => ft.tagId);

      if (followedTagIds.length > 0) {
        // Split limit: 70% from followed tags, 30% from others
        const followedLimit = Math.ceil(take * 0.7);
        const othersLimit = take - followedLimit;

        // Get posts from followed tags
        const followedPosts = await prisma.post.findMany({
          where: {
            ...where,
            tags: {
              some: {
                tagId: { in: followedTagIds },
              },
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
            voteList: {
              where: { userId },
              select: { type: true },
            },
          },
          orderBy,
          skip: Math.floor(skip * 0.7),
          take: followedLimit,
        });

        // Get other posts (excluding those from followed tags)
        const otherPosts = await prisma.post.findMany({
          where: {
            ...where,
            tags: {
              none: {
                tagId: { in: followedTagIds },
              },
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
            voteList: {
              where: { userId },
              select: { type: true },
            },
          },
          orderBy,
          skip: Math.floor(skip * 0.3),
          take: othersLimit,
        });

        // Merge posts: followed tags first, then others
        posts = [...followedPosts, ...otherPosts];

        // Get total count
        total = await prisma.post.count({ where });
      } else {
        // No followed tags, use default query
        [posts, total] = await Promise.all([
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
              voteList: {
                where: { userId },
                select: { type: true },
              },
            },
            orderBy,
            skip,
            take,
          }),
          prisma.post.count({ where }),
        ]);
      }
    } else {
      // Default query (no user or different filter)
      [posts, total] = await Promise.all([
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
    }

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content.substring(0, 200) + "...",
      slug: post.slug,
      author: post.author,
      tags: post.tags.map((pt: any) => pt.tag),
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
      meta: createPaginationMeta({ page, limit, total }),
    };
  }

  static async getPostBySlug(slug: string, userId?: string) {
    const post = await PostRepository.findBySlug(slug, userId);

    if (!post) {
      throw new NotFoundError("Post não encontrado");
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
    const slug = await generateUniqueSlug(data.title, "post");

    // Verify tags exist
    const tags = await prisma.tag.findMany({
      where: { id: { in: data.tagIds } },
    });

    if (tags.length !== data.tagIds.length) {
      throw new NotFoundError("Uma ou mais tags não foram encontradas");
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

    // Send notifications to users following these tags (async, non-blocking)
    this.notifyTagFollowers(post.id, post.authorId, data.tagIds, tags).catch(
      (error) => {
        console.error("Error sending tag follower notifications:", error);
      }
    );

    return {
      ...post,
      tags: post.tags.map((pt) => pt.tag),
    };
  }

  /**
   * Notify users who follow the tags of a new post
   */
  private static async notifyTagFollowers(
    postId: string,
    authorId: string,
    tagIds: string[],
    tags: any[]
  ) {
    // Get all users following these tags (with notification enabled)
    const followers = await prisma.userTagFollow.findMany({
      where: {
        tagId: { in: tagIds },
        notifyOnNewPost: true,
        userId: { not: authorId }, // Don't notify the author
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        tag: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      distinct: ["userId"], // Each user should only receive one notification
    });

    if (followers.length === 0) {
      return;
    }

    // Create notifications for all followers
    const notifications = followers.map((follower) => ({
      userId: follower.userId,
      type: "NEW_POST_IN_FOLLOWED_TAG" as const,
      title: `Novo post em ${follower.tag.name}`,
      message: `Um novo post foi publicado numa tag que segues: ${follower.tag.name}`,
      relatedPostId: postId,
      senderId: authorId,
    }));

    await prisma.notification.createMany({
      data: notifications,
    });
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
      throw new NotFoundError("Post não encontrado");
    }

    // Check authorization
    const isAuthor = post.authorId === userId;
    const isAdmin = userRoles.includes("ADMIN");

    if (!isAuthor && !isAdmin) {
      throw new AuthorizationError();
    }

    let slug = post.slug;
    if (data.title && data.title !== post.title) {
      slug = await generateUniqueSlug(data.title, "post");
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
          throw new NotFoundError("Uma ou mais tags não foram encontradas");
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
      throw new NotFoundError("Post não encontrado");
    }

    // Check authorization
    const isAuthor = post.authorId === userId;
    const isAdmin = userRoles.includes("ADMIN");

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
