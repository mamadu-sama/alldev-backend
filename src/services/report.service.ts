import { prisma } from "@/config/database";
import { ReportReason, ReportStatus } from "@prisma/client";
import { getPaginationParams, createPaginationMeta } from "@/utils/pagination";
import { NotFoundError, ValidationError } from "@/types";

export class ReportService {
  static async createReport(
    reporterId: string,
    reason: ReportReason,
    description: string,
    postId?: string,
    commentId?: string
  ) {
    // Verify that either postId or commentId is provided
    if (!postId && !commentId) {
      throw new ValidationError("Deve fornecer postId ou commentId");
    }

    if (postId && commentId) {
      throw new ValidationError(
        "Não pode denunciar post e comentário simultaneamente"
      );
    }

    // Check if user already reported this content
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId,
        ...(postId ? { postId } : { commentId }),
      },
    });

    if (existingReport) {
      throw new ValidationError("Já denunciou este conteúdo");
    }

    // Verify content exists
    if (postId) {
      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        throw new NotFoundError("Post não encontrado");
      }
    }

    if (commentId) {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
      });
      if (!comment) {
        throw new NotFoundError("Comentário não encontrado");
      }
    }

    return await prisma.report.create({
      data: {
        reporterId,
        reason,
        description,
        postId,
        commentId,
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        post: postId
          ? {
              select: {
                id: true,
                title: true,
                slug: true,
                author: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
            }
          : undefined,
        comment: commentId
          ? {
              select: {
                id: true,
                content: true,
                post: { select: { slug: true } },
                author: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
            }
          : undefined,
      },
    });
  }

  static async getReports(
    page: number = 1,
    limit: number = 20,
    status?: ReportStatus
  ) {
    const { skip, take } = getPaginationParams({ page, limit });

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
              author: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          comment: {
            select: {
              id: true,
              content: true,
              post: { select: { slug: true } },
              author: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          // reviewer: { // ❌ REMOVIDO pois não existe reviewer no schema
          //   select: {
          //     id: true,
          //     username: true,
          //   },
          // },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.report.count({ where }),
    ]);

    return {
      data: reports,
      meta: createPaginationMeta(page, limit, total),
    };
  }

  static async updateReportStatus(
    reportId: string,
    reviewerId: string,
    status: ReportStatus,
    resolution?: string
  ) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundError("Denúncia não encontrada");
    }

    return await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        resolverNotes: resolution,
        resolvedById: reviewerId,
        resolvedAt: new Date(),
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }
}

