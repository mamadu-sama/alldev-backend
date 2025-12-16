/**
 * Script para criar reports de teste em comentários
 * Útil para testar o painel de moderação de comentários
 */

import { PrismaClient, ReportStatus, ReportTargetType } from "@prisma/client";

const prisma = new PrismaClient();

const TEST_REPORT_REASONS = [
  "Conteúdo ofensivo ou inapropriado",
  "Spam ou propaganda não solicitada",
  "Assédio ou bullying",
  "Informação falsa ou enganosa",
  "Violação de direitos autorais",
];

async function createTestCommentReports() {
  console.log("🔨 Criando reports de teste para comentários...\n");

  try {
    // 1. Buscar comentários existentes
    const comments = await prisma.comment.findMany({
      take: 5,
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (comments.length === 0) {
      console.log("❌ Nenhum comentário encontrado no banco.");
      console.log(
        "💡 Crie posts e comentários primeiro, depois execute este script."
      );
      return;
    }

    console.log(`✅ Encontrados ${comments.length} comentários.\n`);

    // 2. Buscar usuários para serem reporters
    const users = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        username: true,
      },
    });

    if (users.length < 2) {
      console.log("❌ Precisa de pelo menos 2 usuários no banco.");
      return;
    }

    console.log(`✅ Encontrados ${users.length} usuários.\n`);

    // 3. Criar reports para cada comentário
    let reportsCreated = 0;

    for (const comment of comments) {
      // Pegar 1-3 reporters diferentes do autor
      const reporters = users
        .filter((u) => u.id !== comment.author.id)
        .slice(0, Math.floor(Math.random() * 3) + 1); // 1 a 3 reporters

      if (reporters.length === 0) continue;

      for (const reporter of reporters) {
        // Verificar se já existe report deste usuário para este comentário
        const existingReport = await prisma.report.findFirst({
          where: {
            targetId: comment.id,
            targetType: ReportTargetType.COMMENT,
            reporterId: reporter.id,
          },
        });

        if (existingReport) {
          console.log(
            `⏭️  Pulando: @${reporter.username} já reportou este comentário`
          );
          continue;
        }

        // Criar report
        const reason =
          TEST_REPORT_REASONS[
            Math.floor(Math.random() * TEST_REPORT_REASONS.length)
          ];

        await prisma.report.create({
          data: {
            targetId: comment.id,
            targetType: ReportTargetType.COMMENT,
            reason,
            description: `Report de teste criado automaticamente. Comentário em "${comment.post.title.slice(
              0,
              40
            )}..."`,
            reporterId: reporter.id,
            status: ReportStatus.PENDING,
          },
        });

        reportsCreated++;
        console.log(`✅ Report criado:`);
        console.log(`   Reporter: @${reporter.username}`);
        console.log(`   Comentário: "${comment.content.slice(0, 50)}..."`);
        console.log(`   Post: "${comment.post.title.slice(0, 40)}..."`);
        console.log(`   Motivo: ${reason}\n`);
      }
    }

    console.log(`\n🎉 Total de reports criados: ${reportsCreated}`);

    // 4. Mostrar estatísticas
    const totalPendingReports = await prisma.report.count({
      where: {
        targetType: ReportTargetType.COMMENT,
        status: ReportStatus.PENDING,
      },
    });

    const commentsWithReports = await prisma.comment.findMany({
      where: {
        reports: {
          some: {
            status: ReportStatus.PENDING,
          },
        },
      },
      include: {
        _count: {
          select: {
            reports: {
              where: {
                status: ReportStatus.PENDING,
              },
            },
          },
        },
      },
    });

    console.log("\n📊 Estatísticas Finais:");
    console.log(`   Total de reports pendentes: ${totalPendingReports}`);
    console.log(`   Comentários com reports: ${commentsWithReports.length}`);
    console.log("\n📍 Agora acesse: http://localhost:3000/moderator/comments");
  } catch (error) {
    console.error("❌ Erro ao criar reports:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
createTestCommentReports();
