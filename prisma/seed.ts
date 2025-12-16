import {
  PrismaClient,
  Role,
  UserLevel,
  NotificationType,
  VoteType,
  Tag,
  User,
  Post,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Função para criar slug
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

// Dados para seed
const TAGS_DATA = [
  { name: "JavaScript", description: "Linguagem de programação para web" },
  { name: "TypeScript", description: "JavaScript com tipagem estática" },
  { name: "React", description: "Biblioteca JavaScript para interfaces" },
  { name: "Node.js", description: "Ambiente de execução JavaScript" },
  { name: "Python", description: "Linguagem de programação versátil" },
  { name: "Django", description: "Framework web Python" },
  { name: "Express", description: "Framework web para Node.js" },
  { name: "PostgreSQL", description: "Banco de dados relacional" },
  { name: "MongoDB", description: "Banco de dados NoSQL" },
  { name: "Docker", description: "Plataforma de containerização" },
  { name: "Git", description: "Sistema de controle de versão" },
  { name: "CSS", description: "Estilização de páginas web" },
  { name: "HTML", description: "Linguagem de marcação web" },
  { name: "Next.js", description: "Framework React para produção" },
  { name: "Vue.js", description: "Framework JavaScript progressivo" },
];

const POSTS_DATA = [
  {
    title: "Como implementar autenticação JWT em Node.js?",
    content:
      "Estou desenvolvendo uma API REST e preciso implementar autenticação JWT. Quais são as melhores práticas? Devo armazenar o token no localStorage ou em cookies?",
    tags: ["Node.js", "JavaScript", "Express"],
  },
  {
    title: "Diferença entre var, let e const em JavaScript",
    content:
      "Sempre fico confuso sobre quando usar var, let ou const. Alguém pode explicar de forma clara as diferenças e quando usar cada um?",
    tags: ["JavaScript"],
  },
  {
    title: "React Hooks: useState vs useReducer",
    content:
      "Em que situações devo usar useReducer ao invés de useState? Qual a diferença de performance entre eles?",
    tags: ["React", "JavaScript"],
  },
  {
    title: "Como otimizar queries no PostgreSQL?",
    content:
      "Minha aplicação está com queries lentas. Quais técnicas vocês usam para otimizar queries complexas no PostgreSQL? Índices sempre ajudam?",
    tags: ["PostgreSQL"],
  },
  {
    title: "TypeScript vale a pena para projetos pequenos?",
    content:
      "Estou iniciando um projeto pessoal pequeno. Vale a pena usar TypeScript ou a configuração inicial não compensa? Quais os prós e contras?",
    tags: ["TypeScript", "JavaScript"],
  },
  {
    title: "Docker compose para desenvolvimento local",
    content:
      "Compartilho meu docker-compose.yml para desenvolvimento com Node.js + PostgreSQL + Redis. Inclui hot reload e debugging!",
    tags: ["Docker", "Node.js"],
  },
  {
    title: "Melhores práticas de segurança em APIs REST",
    content:
      "Lista completa de práticas de segurança: rate limiting, CORS, helmet, validação de inputs, SQL injection prevention, XSS protection...",
    tags: ["Node.js", "Express"],
  },
  {
    title: "Python vs JavaScript para backend?",
    content:
      "Estou começando no backend. Devo aprender Python (Django) ou continuar com JavaScript (Node.js)? Qual tem melhor mercado?",
    tags: ["Python", "JavaScript", "Django", "Node.js"],
  },
  {
    title: "Como fazer deploy de aplicação Next.js na Vercel",
    content:
      "Tutorial passo a passo de como fazer deploy de uma aplicação Next.js na Vercel, incluindo variáveis de ambiente e domínio customizado.",
    tags: ["Next.js", "React"],
  },
  {
    title: "Git: Como desfazer um commit já enviado?",
    content:
      "Enviei um commit com informações sensíveis para o GitHub. Como faço para remover completamente do histórico? git reset --hard não funcionou.",
    tags: ["Git"],
  },
  {
    title: "CSS Grid vs Flexbox: quando usar cada um?",
    content:
      "Ainda tenho dúvidas sobre quando usar Grid ou Flexbox. Existe uma regra geral ou depende do caso? Exemplos práticos seriam ótimos!",
    tags: ["CSS", "HTML"],
  },
  {
    title: "MongoDB vs PostgreSQL: qual escolher?",
    content:
      "Para um projeto de e-commerce, qual banco de dados vocês recomendam? Preciso de transações, mas também de flexibilidade no schema.",
    tags: ["MongoDB", "PostgreSQL"],
  },
  {
    title: "Vue 3 Composition API: Vale a migração?",
    content:
      "Tenho um projeto grande em Vue 2 Options API. Vale a pena migrar para Vue 3 Composition API? Quanto tempo leva?",
    tags: ["Vue.js", "JavaScript"],
  },
  {
    title: "Como debugar código JavaScript no VSCode?",
    content:
      "Tutorial completo de debugging no VSCode: breakpoints, watch, call stack, e configuração do launch.json para Node.js e navegador.",
    tags: ["JavaScript", "Node.js"],
  },
  {
    title: "React Context vs Redux: ainda preciso de Redux?",
    content:
      "Com Context API e hooks, ainda faz sentido usar Redux? Em que cenários Redux ainda é necessário?",
    tags: ["React", "JavaScript"],
  },
  {
    title: "TypeScript Generics: explicação simples",
    content:
      "Generics sempre foram confusos para mim. Alguém tem uma explicação simples com exemplos práticos do dia a dia?",
    tags: ["TypeScript"],
  },
  {
    title: "Como implementar SSR em React sem Next.js?",
    content:
      "É possível fazer Server-Side Rendering em React sem usar Next.js? Como configurar com Express?",
    tags: ["React", "Node.js", "Express"],
  },
  {
    title: "Docker: diferença entre CMD e ENTRYPOINT",
    content:
      "Nunca entendi direito a diferença entre CMD e ENTRYPOINT no Dockerfile. Quando usar cada um?",
    tags: ["Docker"],
  },
  {
    title: "Python: list comprehension vs map/filter",
    content:
      "Qual é mais pythônico? List comprehension ou usar map/filter? Existe diferença de performance?",
    tags: ["Python"],
  },
  {
    title: "Como fazer testes unitários em JavaScript?",
    content:
      "Tutorial básico de testes com Jest: setup, mocking, coverage, e boas práticas. Inclui exemplos de testes assíncronos!",
    tags: ["JavaScript", "Node.js"],
  },
];

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n");

  // Limpar banco de dados
  console.log("🗑️  Limpando banco de dados...");
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.socialLinks.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Banco limpo!\n");

  // Hash de senha padrão
  const passwordHash = await bcrypt.hash("senha123", 10);

  // 1. Criar Admin
  console.log("👤 Criando usuário admin...");
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@alldev.com",
      passwordHash,
      isVerified: true,
      reputation: 1000,
      level: UserLevel.GURU,
      bio: "Administrador da plataforma AllDev Community Hub",
      skills: ["Node.js", "React", "PostgreSQL", "TypeScript", "Docker"],
      roles: {
        create: {
          role: Role.ADMIN,
        },
      },
      socialLinks: {
        create: {
          github: "https://github.com/alldev",
          linkedin: "https://linkedin.com/company/alldev",
          twitter: "https://twitter.com/alldev",
        },
      },
    },
  });
  console.log(`✅ Admin criado: ${admin.username}\n`);

  // 2. Criar Usuários Comuns
  console.log("👥 Criando usuários comuns...");
  const usernames = [
    "joaosilva",
    "mariacoders",
    "pedrodev",
    "anatech",
    "carlosfullstack",
    "juliajs",
    "ricardopy",
    "beatrizfrontend",
    "lucasbackend",
    "fernandacloud",
  ];

  const users: User[] = [];
  for (const username of usernames) {
    const user = await prisma.user.create({
      data: {
        username,
        email: `${username}@email.com`,
        passwordHash,
        isVerified: true,
        reputation: Math.floor(Math.random() * 500) + 50,
        level: [UserLevel.NOVATO, UserLevel.CONTRIBUIDOR, UserLevel.EXPERT][
          Math.floor(Math.random() * 3)
        ],
        bio: `Desenvolvedor apaixonado por tecnologia. Sempre aprendendo coisas novas!`,
        skills: ["JavaScript", "React", "Node.js"].slice(
          0,
          Math.floor(Math.random() * 3) + 1
        ),
        roles: {
          create: {
            role: Role.USER,
          },
        },
      },
    });
    users.push(user);
  }
  console.log(`✅ ${users.length} usuários criados!\n`);

  // 3. Criar Tags
  console.log("🏷️  Criando tags...");
  const tags: Tag[] = [];
  for (const tagData of TAGS_DATA) {
    const tag = await prisma.tag.create({
      data: {
        name: tagData.name,
        slug: createSlug(tagData.name),
        description: tagData.description,
      },
    });
    tags.push(tag);
  }
  console.log(`✅ ${tags.length} tags criadas!\n`);

  // 4. Criar Posts
  console.log("📝 Criando posts...");
  const posts: Post[] = [];
  const allUsers = [admin, ...users];

  for (let i = 0; i < POSTS_DATA.length; i++) {
    const postData = POSTS_DATA[i];
    const author = allUsers[Math.floor(Math.random() * allUsers.length)];
    const slug = createSlug(postData.title);

    const post = await prisma.post.create({
      data: {
        title: postData.title,
        slug: `${slug}-${Date.now()}-${i}`,
        content: postData.content,
        authorId: author.id,
        votes: Math.floor(Math.random() * 50) - 10,
      },
    });

    // Associar tags
    const postTags = postData.tags
      .map((tagName) => tags.find((t) => t.name === tagName))
      .filter(Boolean);

    for (const tag of postTags) {
      if (tag) {
        await prisma.postTag.create({
          data: {
            postId: post.id,
            tagId: tag.id,
          },
        });

        // Atualizar contador de posts da tag
        await prisma.tag.update({
          where: { id: tag.id },
          data: { postCount: { increment: 1 } },
        });
      }
    }

    posts.push(post);
  }
  console.log(`✅ ${posts.length} posts criados!\n`);

  // 5. Criar Comentários
  console.log("💬 Criando comentários...");
  let commentCount = 0;
  let replyCount = 0;

  for (const post of posts) {
    // 2-5 comentários por post
    const numComments = Math.floor(Math.random() * 4) + 2;

    for (let i = 0; i < numComments; i++) {
      const author = allUsers[Math.floor(Math.random() * allUsers.length)];

      const commentTexts = [
        "Ótima pergunta! Também tenho essa dúvida.",
        "Eu uso essa abordagem no meu projeto e funciona muito bem!",
        "Excelente explicação, me ajudou bastante!",
        "Você já tentou usar essa biblioteca? Ela resolve isso facilmente.",
        "Tive o mesmo problema e resolvi fazendo assim...",
        "Obrigado por compartilhar! Muito útil.",
        "Interessante! Não conhecia essa abordagem.",
        "Acho que tem uma forma mais simples de fazer isso.",
      ];

      const comment = await prisma.comment.create({
        data: {
          content:
            commentTexts[Math.floor(Math.random() * commentTexts.length)],
          postId: post.id,
          authorId: author.id,
          votes: Math.floor(Math.random() * 20) - 5,
        },
      });

      commentCount++;

      // 30% de chance de ter respostas
      if (Math.random() > 0.7) {
        const numReplies = Math.floor(Math.random() * 3) + 1;

        for (let j = 0; j < numReplies; j++) {
          const replyAuthor =
            allUsers[Math.floor(Math.random() * allUsers.length)];

          const replyTexts = [
            "Concordo totalmente!",
            "Obrigado pela resposta!",
            "Isso faz muito sentido.",
            "Interessante ponto de vista!",
            "Vou testar essa solução.",
            "Exatamente o que eu estava procurando!",
          ];

          await prisma.comment.create({
            data: {
              content:
                replyTexts[Math.floor(Math.random() * replyTexts.length)],
              postId: post.id,
              authorId: replyAuthor.id,
              parentId: comment.id,
              votes: Math.floor(Math.random() * 10),
            },
          });

          replyCount++;
        }
      }
    }
  }
  console.log(`✅ ${commentCount} comentários criados!`);
  console.log(`✅ ${replyCount} respostas criadas!\n`);

  // 6. Criar Votos
  console.log("👍 Criando votos...");
  let voteCount = 0;

  // Votos em posts
  for (const post of posts) {
    const numVoters = Math.floor(Math.random() * 8) + 2;
    const voters = users.sort(() => 0.5 - Math.random()).slice(0, numVoters);

    for (const voter of voters) {
      try {
        await prisma.vote.create({
          data: {
            userId: voter.id,
            postId: post.id,
            type: Math.random() > 0.3 ? VoteType.UP : VoteType.DOWN,
          },
        });
        voteCount++;
      } catch (error) {
        // Ignorar duplicatas
      }
    }
  }

  // Votos em comentários
  const allComments = await prisma.comment.findMany();
  for (const comment of allComments.slice(0, 30)) {
    const numVoters = Math.floor(Math.random() * 5) + 1;
    const voters = users.sort(() => 0.5 - Math.random()).slice(0, numVoters);

    for (const voter of voters) {
      try {
        await prisma.vote.create({
          data: {
            userId: voter.id,
            commentId: comment.id,
            type: Math.random() > 0.2 ? VoteType.UP : VoteType.DOWN,
          },
        });
        voteCount++;
      } catch (error) {
        // Ignorar duplicatas
      }
    }
  }
  console.log(`✅ ${voteCount} votos criados!\n`);

  // 7. Criar Notificações
  console.log("🔔 Criando notificações...");
  const notificationTypes = [
    NotificationType.COMMENT,
    NotificationType.REPLY,
    NotificationType.VOTE,
    NotificationType.ACCEPTED,
  ];

  let notificationCount = 0;
  for (const user of users.slice(0, 5)) {
    for (let i = 0; i < 3; i++) {
      const type =
        notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const sender = allUsers[Math.floor(Math.random() * allUsers.length)];

      const messages = {
        COMMENT: `${sender.username} comentou no seu post`,
        REPLY: `${sender.username} respondeu ao seu comentário`,
        VOTE: `${sender.username} votou no seu conteúdo`,
        ACCEPTED: `${sender.username} aceitou sua resposta`,
      };

      await prisma.notification.create({
        data: {
          userId: user.id,
          type,
          message: messages[type],
          senderId: sender.id,
          read: Math.random() > 0.5,
        },
      });
      notificationCount++;
    }
  }
  console.log(`✅ ${notificationCount} notificações criadas!\n`);

  // 8. Atualizar contadores
  console.log("📊 Atualizando contadores...");

  // Atualizar voteCount dos posts
  for (const post of posts) {
    const votes = await prisma.vote.count({
      where: { postId: post.id, type: VoteType.UP },
    });
    const downvotes = await prisma.vote.count({
      where: { postId: post.id, type: VoteType.DOWN },
    });

    await prisma.post.update({
      where: { id: post.id },
      data: { votes: votes - downvotes },
    });
  }

  console.log("✅ Contadores atualizados!\n");

  // Estatísticas finais
  console.log("📈 Estatísticas do seed:");
  console.log("========================");
  console.log(
    `👤 Usuários: ${allUsers.length} (1 admin + ${users.length} comuns)`
  );
  console.log(`🏷️  Tags: ${tags.length}`);
  console.log(`📝 Posts: ${posts.length}`);
  console.log(`💬 Comentários: ${commentCount}`);
  console.log(`↩️  Respostas: ${replyCount}`);
  console.log(`👍 Votos: ${voteCount}`);
  console.log(`🔔 Notificações: ${notificationCount}`);
  console.log("========================\n");

  console.log("🎉 Seed concluído com sucesso!\n");
  console.log("📝 Credenciais de login:");
  console.log("------------------------");
  console.log("Admin:");
  console.log("  Email: admin@alldev.com");
  console.log("  Senha: senha123\n");
  console.log("Usuários comuns:");
  console.log("  Email: [username]@email.com");
  console.log("  Senha: senha123");
  console.log("  Exemplos: joaosilva@email.com, mariacoders@email.com\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
