# Alldev - Documentação de Implementação do Backend

## Índice

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológica](#stack-tecnológica)
3. [Arquitetura](#arquitetura)
4. [Setup do Ambiente](#setup-do-ambiente)
5. [Estrutura do Projeto](#estrutura-do-projeto)
6. [Base de Dados](#base-de-dados)
7. [API Endpoints](#api-endpoints)
8. [Autenticação e Autorização](#autenticação-e-autorização)
9. [Validação](#validação)
10. [Sistema de Reputação](#sistema-de-reputação)
11. [Notificações](#notificações)
12. [Upload de Ficheiros](#upload-de-ficheiros)
13. [Testes](#testes)
14. [Deploy](#deploy)

---

## Visão Geral

Este documento fornece todas as especificações necessárias para implementar o backend da plataforma **Alldev** - uma comunidade de programadores .

### Requisitos Funcionais Principais

- Sistema de autenticação JWT
- CRUD de posts com suporte a Markdown
- Sistema de comentários hierárquico
- Votação (upvote/downvote) em posts e comentários
- Sistema de reputação e níveis
- Gestão de tags
- Sistema de notificações
- Painéis de administração e moderação
- Pesquisa full-text

---

## Stack Tecnológica

| Tecnologia         | Versão Recomendada | Finalidade               |
| ------------------ | ------------------ | ------------------------ |
| **Node.js**        | 20.x LTS           | Runtime JavaScript       |
| **Express.js**     | 4.18.x             | Framework HTTP           |
| **TypeScript**     | 5.x                | Tipagem estática         |
| **PostgreSQL**     | 15.x               | Base de dados relacional |
| **Prisma**         | 5.x                | ORM e migrações          |
| **Docker**         | 24.x               | Containerização          |
| **Docker Compose** | 2.x                | Orquestração local       |
| **JWT**            | -                  | Autenticação stateless   |
| **bcrypt**         | 5.x                | Hash de passwords        |
| **Zod**            | 3.x                | Validação de schemas     |
| **Jest**           | 29.x               | Testes unitários         |
| **Supertest**      | 6.x                | Testes de integração     |
| **Winston**        | 3.x                | Logging                  |
| **Multer**         | 1.4.x              | Upload de ficheiros      |
| **Sharp**          | 0.32.x             | Processamento de imagens |
| **Nodemailer**     | 6.x                | Envio de emails          |
| **Redis**          | 7.x                | Cache e rate limiting    |

---

## Arquitetura

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway / Nginx                      │
│                    (Rate Limiting, SSL)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express.js Backend                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Routes  │→ │Middleware│→ │Controllers│→ │ Services │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌─────────────────┐
│   PostgreSQL    │          │     Redis       │
│   (Prisma ORM)  │          │   (Cache)       │
└─────────────────┘          └─────────────────┘
         │
         ▼
┌─────────────────┐
│  File Storage   │
│  (Local/S3)     │
└─────────────────┘
```

### Padrões de Arquitetura

- **Layered Architecture**: Routes → Controllers → Services → Repositories
- **Repository Pattern**: Abstração do acesso a dados
- **Dependency Injection**: Facilita testes e manutenção
- **Error Handling Centralizado**: Middleware de erros global

---

## Setup do Ambiente

### Variáveis de Ambiente

Criar ficheiro `.env`:

```env
# Server
NODE_ENV=development
PORT=3001
API_PREFIX=/api

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/alldev

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d

# Redis
REDIS_URL=redis://localhost:6379

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
EMAIL_FROM=noreply@alldev.com

# Storage
AWS_ACCESS_KEY_ID=aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=eu-west-3
AWS_BUCKET_NAME=bucket-name
AWS_BASE_URL=https://bucket-name.s3.eu-west-3.amazonaws.com
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Frontend URL (para emails e CORS)
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/alldev
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./uploads:/app/uploads
    networks:
      - alldev-network

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: alldev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - alldev-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - alldev-network

volumes:
  postgres_data:
  redis_data:

networks:
  alldev-network:
    driver: bridge
```

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 3000
CMD ["npm", "start"]
```

---

## Estrutura do Projeto

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── multer.ts
│   │   └── env.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── post.controller.ts
│   │   ├── comment.controller.ts
│   │   ├── tag.controller.ts
│   │   ├── vote.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── search.controller.ts
│   │   ├── admin.controller.ts
│   │   └── moderator.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── validate.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   └── upload.middleware.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── post.routes.ts
│   │   ├── comment.routes.ts
│   │   ├── tag.routes.ts
│   │   ├── vote.routes.ts
│   │   ├── notification.routes.ts
│   │   ├── search.routes.ts
│   │   ├── admin.routes.ts
│   │   └── moderator.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── post.service.ts
│   │   ├── comment.service.ts
│   │   ├── tag.service.ts
│   │   ├── vote.service.ts
│   │   ├── notification.service.ts
│   │   ├── reputation.service.ts
│   │   ├── search.service.ts
│   │   ├── email.service.ts
│   │   └── upload.service.ts
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   ├── post.repository.ts
│   │   ├── comment.repository.ts
│   │   ├── tag.repository.ts
│   │   ├── vote.repository.ts
│   │   └── notification.repository.ts
│   ├── schemas/
│   │   ├── auth.schema.ts
│   │   ├── user.schema.ts
│   │   ├── post.schema.ts
│   │   ├── comment.schema.ts
│   │   └── common.schema.ts
│   ├── types/
│   │   ├── express.d.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── slug.ts
│   │   ├── pagination.ts
│   │   ├── password.ts
│   │   ├── jwt.ts
│   │   └── logger.ts
│   ├── app.ts
│   └── server.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── setup.ts
├── uploads/
├── .env
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── jest.config.js
```

---

## Base de Dados

### Schema Prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum Role {
  USER
  MODERATOR
  ADMIN
}

enum UserLevel {
  NOVATO
  CONTRIBUIDOR
  EXPERT
  GURU
}

enum VoteType {
  UP
  DOWN
}

enum NotificationType {
  COMMENT
  REPLY
  VOTE
  ACCEPTED
  MENTION
  SYSTEM
}

enum ReportStatus {
  PENDING
  APPROVED
  REJECTED
}

enum ReportReason {
  SPAM
  HARASSMENT
  INAPPROPRIATE
  OFF_TOPIC
  DUPLICATE
  OTHER
}

// ============================================
// MODELS
// ============================================

model User {
  id           String    @id @default(uuid())
  username     String    @unique
  email        String    @unique
  passwordHash String    @map("password_hash")
  avatarUrl    String?   @map("avatar_url")
  bio          String?
  skills       String[]  @default([])
  reputation   Int       @default(0)
  level        UserLevel @default(NOVATO)
  isActive     Boolean   @default(true) @map("is_active")
  isVerified   Boolean   @default(false) @map("is_verified")
  lastLoginAt  DateTime? @map("last_login_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  // Relations
  socialLinks       SocialLinks?
  roles             UserRole[]
  posts             Post[]
  comments          Comment[]
  votes             Vote[]
  notifications     Notification[]
  sentNotifications Notification[]    @relation("SentNotifications")
  reports           Report[]          @relation("Reporter")
  reportedContent   Report[]          @relation("ReportedUser")
  moderatorActions  ModeratorAction[]
  refreshTokens     RefreshToken[]

  @@index([username])
  @@index([email])
  @@index([reputation])
  @@map("users")
}

model SocialLinks {
  id        String  @id @default(uuid())
  userId    String  @unique @map("user_id")
  github    String?
  linkedin  String?
  twitter   String?
  portfolio String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("social_links")
}

model UserRole {
  id     String @id @default(uuid())
  userId String @map("user_id")
  role   Role

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, role])
  @@map("user_roles")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@map("refresh_tokens")
}

model Post {
  id                String   @id @default(uuid())
  title             String
  content           String
  slug              String   @unique
  authorId          String   @map("author_id")
  votes             Int      @default(0)
  views             Int      @default(0)
  commentCount      Int      @default(0) @map("comment_count")
  hasAcceptedAnswer Boolean  @default(false) @map("has_accepted_answer")
  isHidden          Boolean  @default(false) @map("is_hidden")
  isLocked          Boolean  @default(false) @map("is_locked")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  // Relations
  author   User          @relation(fields: [authorId], references: [id], onDelete: Cascade)
  tags     PostTag[]
  comments Comment[]
  voteList Vote[]
  reports  Report[]
  actions  ModeratorAction[]

  @@index([slug])
  @@index([authorId])
  @@index([createdAt])
  @@index([votes])
  @@map("posts")
}

model Tag {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  description String?
  postCount   Int      @default(0) @map("post_count")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  posts PostTag[]

  @@index([slug])
  @@index([postCount])
  @@map("tags")
}

model PostTag {
  postId String @map("post_id")
  tagId  String @map("tag_id")

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
  @@map("post_tags")
}

model Comment {
  id         String   @id @default(uuid())
  content    String
  postId     String   @map("post_id")
  authorId   String   @map("author_id")
  parentId   String?  @map("parent_id")
  votes      Int      @default(0)
  isAccepted Boolean  @default(false) @map("is_accepted")
  isHidden   Boolean  @default(false) @map("is_hidden")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  // Relations
  post     Post              @relation(fields: [postId], references: [id], onDelete: Cascade)
  author   User              @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent   Comment?          @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies  Comment[]         @relation("CommentReplies")
  voteList Vote[]
  reports  Report[]
  actions  ModeratorAction[]

  @@index([postId])
  @@index([authorId])
  @@index([parentId])
  @@map("comments")
}

model Vote {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  postId    String?  @map("post_id")
  commentId String?  @map("comment_id")
  type      VoteType
  createdAt DateTime @default(now()) @map("created_at")

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post    Post?    @relation(fields: [postId], references: [id], onDelete: Cascade)
  comment Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@unique([userId, commentId])
  @@index([postId])
  @@index([commentId])
  @@map("votes")
}

model Notification {
  id               String           @id @default(uuid())
  userId           String           @map("user_id")
  type             NotificationType
  title            String?
  message          String
  read             Boolean          @default(false)
  relatedPostId    String?          @map("related_post_id")
  relatedCommentId String?          @map("related_comment_id")
  senderId         String?          @map("sender_id")
  createdAt        DateTime         @default(now()) @map("created_at")

  user   User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  sender User? @relation("SentNotifications", fields: [senderId], references: [id], onDelete: SetNull)

  @@index([userId, read])
  @@index([createdAt])
  @@map("notifications")
}

model Report {
  id             String       @id @default(uuid())
  reporterId     String       @map("reporter_id")
  postId         String?      @map("post_id")
  commentId      String?      @map("comment_id")
  reportedUserId String?      @map("reported_user_id")
  reason         ReportReason
  description    String?
  status         ReportStatus @default(PENDING)
  resolvedById   String?      @map("resolved_by_id")
  resolvedAt     DateTime?    @map("resolved_at")
  resolverNotes  String?      @map("resolver_notes")
  createdAt      DateTime     @default(now()) @map("created_at")

  reporter     User     @relation("Reporter", fields: [reporterId], references: [id], onDelete: Cascade)
  post         Post?    @relation(fields: [postId], references: [id], onDelete: Cascade)
  comment      Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)
  reportedUser User?    @relation("ReportedUser", fields: [reportedUserId], references: [id], onDelete: SetNull)

  @@index([status])
  @@index([createdAt])
  @@map("reports")
}

model ModeratorAction {
  id          String   @id @default(uuid())
  moderatorId String   @map("moderator_id")
  action      String
  reason      String?
  postId      String?  @map("post_id")
  commentId   String?  @map("comment_id")
  targetUserId String? @map("target_user_id")
  metadata    Json?
  createdAt   DateTime @default(now()) @map("created_at")

  moderator  User     @relation(fields: [moderatorId], references: [id], onDelete: Cascade)
  post       Post?    @relation(fields: [postId], references: [id], onDelete: SetNull)
  comment    Comment? @relation(fields: [commentId], references: [id], onDelete: SetNull)

  @@index([moderatorId])
  @@index([createdAt])
  @@map("moderator_actions")
}

model MaintenanceMode {
  id        String    @id @default(uuid())
  isEnabled Boolean   @default(false) @map("is_enabled")
  message   String?
  endTime   DateTime? @map("end_time")
  updatedBy String?   @map("updated_by")
  updatedAt DateTime  @updatedAt @map("updated_at")

  @@map("maintenance_mode")
}

model PasswordReset {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  used      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  @@index([token])
  @@map("password_resets")
}

model EmailVerification {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([token])
  @@map("email_verifications")
}
```

### Migrações Iniciais

```bash
# Gerar migração inicial
npx prisma migrate dev --name init

# Aplicar migrações em produção
npx prisma migrate deploy

# Gerar cliente Prisma
npx prisma generate
```

### Seed Data

```typescript
// prisma/seed.ts
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Criar admin
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@alldev.com",
      passwordHash: adminPassword,
      isVerified: true,
      reputation: 1000,
      level: "GURU",
      roles: {
        create: { role: Role.ADMIN },
      },
    },
  });

  // Criar tags iniciais
  const tags = [
    {
      name: "JavaScript",
      slug: "javascript",
      description: "Linguagem de programação para web",
    },
    {
      name: "TypeScript",
      slug: "typescript",
      description: "Superset tipado do JavaScript",
    },
    {
      name: "React",
      slug: "react",
      description: "Biblioteca para construção de interfaces",
    },
    {
      name: "Node.js",
      slug: "nodejs",
      description: "Runtime JavaScript no servidor",
    },
    {
      name: "Python",
      slug: "python",
      description: "Linguagem versátil e fácil de aprender",
    },
    {
      name: "PostgreSQL",
      slug: "postgresql",
      description: "Base de dados relacional robusta",
    },
    {
      name: "Docker",
      slug: "docker",
      description: "Plataforma de containerização",
    },
    { name: "Git", slug: "git", description: "Sistema de controlo de versão" },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }

  // Configuração inicial de manutenção
  await prisma.maintenanceMode.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      isEnabled: false,
    },
  });

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## API Endpoints

### Base URL

```
http://localhost:3000/api
```

### Formato de Resposta Padrão

#### Sucesso

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true
  }
}
```

#### Erro

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [{ "field": "email", "message": "Email inválido" }]
  }
}
```

### Códigos de Erro HTTP

| Código | Significado                        |
| ------ | ---------------------------------- |
| 200    | Sucesso                            |
| 201    | Criado com sucesso                 |
| 204    | Sem conteúdo (delete bem-sucedido) |
| 400    | Dados inválidos                    |
| 401    | Não autenticado                    |
| 403    | Sem permissão                      |
| 404    | Não encontrado                     |
| 409    | Conflito (ex: email já existe)     |
| 422    | Entidade não processável           |
| 429    | Demasiados pedidos (rate limit)    |
| 500    | Erro interno do servidor           |

---

### Autenticação

#### `POST /auth/register`

Regista um novo utilizador.

**Request Body:**

```json
{
  "username": "joaosilva",
  "email": "joao@exemplo.com",
  "password": "MinhaPassword123"
}
```

**Validações:**

- `username`: 3-30 caracteres, alfanumérico + underscore
- `email`: formato válido, único
- `password`: mín. 8 caracteres, 1 maiúscula, 1 minúscula, 1 número

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "joaosilva",
      "email": "joao@exemplo.com",
      "level": "Novato",
      "reputation": 0,
      "createdAt": "2024-12-12T10:00:00Z"
    },
    "message": "Registo efetuado. Verifique o seu email."
  }
}
```

---

#### `POST /auth/login`

Autentica um utilizador.

**Request Body:**

```json
{
  "email": "joao@exemplo.com",
  "password": "MinhaPassword123"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "joaosilva",
      "email": "joao@exemplo.com",
      "avatarUrl": null,
      "bio": null,
      "skills": [],
      "socialLinks": null,
      "reputation": 0,
      "level": "Novato",
      "createdAt": "2024-12-12T10:00:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

#### `POST /auth/refresh`

Renova o access token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

#### `POST /auth/logout`

Invalida o refresh token.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (204):** No Content

---

#### `POST /auth/forgot-password`

Envia email de recuperação de password.

**Request Body:**

```json
{
  "email": "joao@exemplo.com"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Se o email existir, receberá instruções de recuperação."
  }
}
```

---

#### `POST /auth/reset-password`

Redefine a password com token.

**Request Body:**

```json
{
  "token": "reset-token-from-email",
  "password": "NovaPassword123"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Password alterada com sucesso."
  }
}
```

---

#### `POST /auth/verify-email`

Verifica o email do utilizador.

**Request Body:**

```json
{
  "token": "verification-token-from-email"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Email verificado com sucesso."
  }
}
```

---

#### `POST /auth/change-password`

Altera a password (requer autenticação).

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "currentPassword": "PasswordAtual123",
  "newPassword": "NovaPassword456"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Password alterada com sucesso."
  }
}
```

---

### Utilizadores

#### `GET /users/me`

Obtém o perfil do utilizador autenticado.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "joaosilva",
    "email": "joao@exemplo.com",
    "avatarUrl": "https://...",
    "bio": "Programador fullstack",
    "skills": ["JavaScript", "React", "Node.js"],
    "socialLinks": {
      "github": "https://github.com/joaosilva",
      "linkedin": "https://linkedin.com/in/joaosilva",
      "twitter": null,
      "portfolio": "https://joaosilva.dev"
    },
    "reputation": 150,
    "level": "Contribuidor",
    "createdAt": "2024-12-12T10:00:00Z"
  }
}
```

---

#### `PATCH /users/me`

Atualiza o perfil do utilizador.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "username": "joaosilva_novo",
  "bio": "Programador fullstack apaixonado por React",
  "skills": ["JavaScript", "React", "Node.js", "PostgreSQL"],
  "socialLinks": {
    "github": "https://github.com/joaosilva",
    "linkedin": "https://linkedin.com/in/joaosilva",
    "twitter": "https://twitter.com/joaosilva",
    "portfolio": "https://joaosilva.dev"
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "joaosilva_novo",
    "...": "..."
  }
}
```

---

#### `POST /users/me/avatar`

Faz upload do avatar.

**Headers:**

```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Request Body:**

- `avatar`: ficheiro de imagem (max 2MB, jpg/png/webp)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://..."
  }
}
```

---

#### `DELETE /users/me/avatar`

Remove o avatar.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (204):** No Content

---

#### `GET /users/:username`

Obtém o perfil público de um utilizador.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "joaosilva",
    "avatarUrl": "https://...",
    "bio": "Programador fullstack",
    "skills": ["JavaScript", "React"],
    "socialLinks": { ... },
    "reputation": 150,
    "level": "Contribuidor",
    "stats": {
      "posts": 15,
      "comments": 42,
      "acceptedAnswers": 8
    },
    "createdAt": "2024-12-12T10:00:00Z"
  }
}
```

---

#### `GET /users/:username/posts`

Lista os posts de um utilizador.

**Query Parameters:**

- `page` (opcional): número da página (default: 1)
- `limit` (opcional): itens por página (default: 20, max: 50)

**Response (200):**

```json
{
  "success": true,
  "data": [ ... array de posts ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "hasMore": false
  }
}
```

---

### Posts

#### `GET /posts`

Lista posts com paginação e filtros.

**Query Parameters:**

- `page` (opcional): número da página (default: 1)
- `limit` (opcional): itens por página (default: 20, max: 50)
- `filter` (opcional): `recent` | `votes` | `unanswered` (default: recent)
- `tag` (opcional): filtrar por slug da tag
- `author` (opcional): filtrar por username do autor

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Como usar React Query?",
      "content": "Estou a tentar...",
      "slug": "como-usar-react-query",
      "author": {
        "id": "uuid",
        "username": "joaosilva",
        "avatarUrl": "https://...",
        "reputation": 150,
        "level": "Contribuidor"
      },
      "tags": [
        { "id": "uuid", "name": "React", "slug": "react" },
        { "id": "uuid", "name": "JavaScript", "slug": "javascript" }
      ],
      "votes": 12,
      "userVote": null,
      "commentCount": 5,
      "views": 234,
      "hasAcceptedAnswer": true,
      "createdAt": "2024-12-12T10:00:00Z",
      "updatedAt": "2024-12-12T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true
  }
}
```

---

#### `GET /posts/:slug`

Obtém um post pelo slug.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Como usar React Query?",
    "content": "# Contexto\n\nEstou a tentar...",
    "slug": "como-usar-react-query",
    "author": { ... },
    "tags": [ ... ],
    "votes": 12,
    "userVote": "up",
    "commentCount": 5,
    "views": 235,
    "hasAcceptedAnswer": true,
    "isLocked": false,
    "createdAt": "2024-12-12T10:00:00Z",
    "updatedAt": "2024-12-12T10:00:00Z"
  }
}
```

---

#### `POST /posts`

Cria um novo post.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "title": "Como usar React Query?",
  "content": "# Contexto\n\nEstou a tentar usar React Query mas...",
  "tagIds": ["uuid1", "uuid2"]
}
```

**Validações:**

- `title`: 10-200 caracteres
- `content`: mín. 30 caracteres
- `tagIds`: 1-5 tags

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Como usar React Query?",
    "slug": "como-usar-react-query",
    "...": "..."
  }
}
```

---

#### `PATCH /posts/:id`

Atualiza um post (apenas autor ou admin).

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "title": "Como usar React Query? [ATUALIZADO]",
  "content": "...",
  "tagIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response (200):**

```json
{
  "success": true,
  "data": { ... }
}
```

---

#### `DELETE /posts/:id`

Elimina um post (apenas autor ou admin).

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (204):** No Content

---

### Comentários

#### `GET /posts/:postId/comments`

Lista comentários de um post.

**Query Parameters:**

- `page` (opcional): default 1
- `limit` (opcional): default 20

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "content": "Podes usar...",
      "postId": "uuid",
      "author": { ... },
      "votes": 5,
      "userVote": null,
      "isAccepted": true,
      "createdAt": "2024-12-12T11:00:00Z"
    }
  ],
  "meta": { ... }
}
```

---

#### `POST /posts/:postId/comments`

Cria um comentário.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "content": "Podes resolver isso usando...",
  "parentId": null
}
```

**Validações:**

- `content`: mín. 10 caracteres
- `parentId`: opcional, para respostas a comentários

**Response (201):**

```json
{
  "success": true,
  "data": { ... }
}
```

---

#### `PATCH /comments/:id`

Atualiza um comentário.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "content": "Conteúdo atualizado..."
}
```

**Response (200):** Comentário atualizado

---

#### `DELETE /comments/:id`

Elimina um comentário.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (204):** No Content

---

#### `POST /comments/:id/accept`

Aceita um comentário como resposta (apenas autor do post).

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Resposta aceite com sucesso."
  }
}
```

---

### Votação

#### `POST /votes`

Vota num post ou comentário.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "type": "up",
  "postId": "uuid",
  "commentId": null
}
```

**Notas:**

- Enviar `postId` OU `commentId`, não ambos
- `type`: `up` | `down`
- Votar novamente com o mesmo tipo remove o voto
- Votar com tipo diferente altera o voto

**Response (200):**

```json
{
  "success": true,
  "data": {
    "votes": 13,
    "userVote": "up"
  }
}
```

---

### Tags

#### `GET /tags`

Lista todas as tags.

**Query Parameters:**

- `sort` (opcional): `popular` | `alphabetical` (default: popular)
- `search` (opcional): pesquisa por nome

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "JavaScript",
      "slug": "javascript",
      "description": "Linguagem de programação para web",
      "postCount": 156
    }
  ]
}
```

---

#### `GET /tags/:slug`

Obtém uma tag pelo slug.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "JavaScript",
    "slug": "javascript",
    "description": "Linguagem de programação para web",
    "postCount": 156
  }
}
```

---

### Pesquisa

#### `GET /search`

Pesquisa global.

**Query Parameters:**

- `q`: termo de pesquisa (mín. 2 caracteres)
- `type` (opcional): `posts` | `users` | `tags` | `all` (default: all)
- `page` (opcional): default 1
- `limit` (opcional): default 20

**Response (200):**

```json
{
  "success": true,
  "data": {
    "posts": [ ... ],
    "users": [ ... ],
    "tags": [ ... ]
  },
  "meta": {
    "query": "react",
    "counts": {
      "posts": 45,
      "users": 12,
      "tags": 3
    }
  }
}
```

---

#### `GET /search/suggestions`

Sugestões de pesquisa (autocomplete).

**Query Parameters:**

- `q`: termo de pesquisa (mín. 2 caracteres)

**Response (200):**

```json
{
  "success": true,
  "data": [
    { "type": "tag", "text": "React", "slug": "react" },
    { "type": "post", "text": "Como usar React?", "slug": "como-usar-react" },
    { "type": "user", "text": "reactdev", "username": "reactdev" }
  ]
}
```

---

### Notificações

#### `GET /notifications`

Lista notificações do utilizador.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Query Parameters:**

- `page` (opcional): default 1
- `limit` (opcional): default 20
- `unread` (opcional): `true` para apenas não lidas

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "comment",
      "message": "joaosilva comentou no teu post",
      "read": false,
      "relatedPostId": "uuid",
      "relatedPostSlug": "como-usar-react",
      "relatedCommentId": "uuid",
      "createdAt": "2024-12-12T12:00:00Z"
    }
  ],
  "meta": {
    "unreadCount": 5,
    "...": "..."
  }
}
```

---

#### `PATCH /notifications/:id/read`

Marca uma notificação como lida.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "read": true
  }
}
```

---

#### `PATCH /notifications/read-all`

Marca todas as notificações como lidas.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Todas as notificações marcadas como lidas."
  }
}
```

---

### Denúncias

#### `POST /reports`

Denuncia conteúdo.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "postId": "uuid",
  "commentId": null,
  "reason": "SPAM",
  "description": "Este post é publicidade..."
}
```

**Razões válidas:**

- `SPAM`
- `HARASSMENT`
- `INAPPROPRIATE`
- `OFF_TOPIC`
- `DUPLICATE`
- `OTHER`

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "message": "Denúncia enviada com sucesso."
  }
}
```

---

### Administração

Todos os endpoints requerem role `ADMIN`.

#### `GET /admin/stats`

Estatísticas gerais.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1500,
      "newToday": 12,
      "newThisWeek": 85,
      "active": 1200
    },
    "posts": {
      "total": 3500,
      "newToday": 25,
      "newThisWeek": 180
    },
    "comments": {
      "total": 12000,
      "newToday": 150
    },
    "reports": {
      "pending": 8,
      "resolvedToday": 3
    }
  }
}
```

---

#### `GET /admin/users`

Lista utilizadores com filtros.

**Query Parameters:**

- `page`, `limit`
- `search`: pesquisa por username/email
- `role`: `USER` | `MODERATOR` | `ADMIN`
- `status`: `active` | `inactive` | `banned`

**Response (200):** Lista paginada de utilizadores

---

#### `PATCH /admin/users/:id/role`

Altera o role de um utilizador.

**Request Body:**

```json
{
  "role": "MODERATOR"
}
```

**Response (200):** Utilizador atualizado

---

#### `PATCH /admin/users/:id/ban`

Bane/desbane um utilizador.

**Request Body:**

```json
{
  "banned": true,
  "reason": "Violação dos termos de uso"
}
```

**Response (200):** Utilizador atualizado

---

#### `DELETE /admin/users/:id`

Elimina um utilizador.

**Response (204):** No Content

---

#### `GET /admin/posts`

Lista todos os posts com filtros.

---

#### `PATCH /admin/posts/:id/hide`

Oculta/mostra um post.

---

#### `DELETE /admin/posts/:id`

Elimina um post.

---

#### `GET /admin/comments`

Lista todos os comentários.

---

#### `PATCH /admin/comments/:id/hide`

Oculta/mostra um comentário.

---

#### `DELETE /admin/comments/:id`

Elimina um comentário.

---

#### `POST /admin/tags`

Cria uma nova tag.

**Request Body:**

```json
{
  "name": "Vue.js",
  "description": "Framework JavaScript progressivo"
}
```

---

#### `PATCH /admin/tags/:id`

Atualiza uma tag.

---

#### `DELETE /admin/tags/:id`

Elimina uma tag.

---

#### `GET /admin/reports`

Lista denúncias.

**Query Parameters:**

- `status`: `PENDING` | `APPROVED` | `REJECTED`

---

#### `PATCH /admin/reports/:id`

Resolve uma denúncia.

**Request Body:**

```json
{
  "status": "APPROVED",
  "notes": "Conteúdo removido por violação das regras."
}
```

---

#### `POST /admin/notifications`

Envia notificação em massa.

**Request Body:**

```json
{
  "title": "Manutenção Programada",
  "message": "O sistema estará em manutenção...",
  "type": "warning",
  "targetAudience": "all"
}
```

---

#### `GET /admin/maintenance`

Obtém estado de manutenção.

---

#### `PATCH /admin/maintenance`

Ativa/desativa modo de manutenção.

**Request Body:**

```json
{
  "isEnabled": true,
  "message": "Estamos a realizar melhorias...",
  "endTime": "2024-12-13T06:00:00Z"
}
```

---

### Moderação

Todos os endpoints requerem role `MODERATOR` ou `ADMIN`.

#### `GET /moderator/queue`

Lista conteúdo a moderar.

---

#### `GET /moderator/reports`

Lista denúncias pendentes.

---

#### `PATCH /moderator/reports/:id`

Resolve uma denúncia.

---

#### `PATCH /moderator/posts/:id/hide`

Oculta/mostra um post.

---

#### `PATCH /moderator/posts/:id/lock`

Bloqueia/desbloqueia comentários num post.

---

#### `PATCH /moderator/comments/:id/hide`

Oculta/mostra um comentário.

---

#### `POST /moderator/warnings`

Envia aviso a um utilizador.

**Request Body:**

```json
{
  "userId": "uuid",
  "message": "O seu comentário foi removido por violar as regras.",
  "relatedPostId": "uuid",
  "relatedCommentId": "uuid"
}
```

---

#### `GET /moderator/history`

Histórico de ações do moderador.

---

## Autenticação e Autorização

### JWT Structure

**Access Token (curta duração: 15min - 1h):**

```json
{
  "sub": "user-uuid",
  "username": "joaosilva",
  "roles": ["USER"],
  "iat": 1702382400,
  "exp": 1702386000
}
```

**Refresh Token (longa duração: 7-30 dias):**

```json
{
  "sub": "user-uuid",
  "type": "refresh",
  "jti": "unique-token-id",
  "iat": 1702382400,
  "exp": 1704974400
}
```

### Middleware de Autenticação

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Token não fornecido" },
      });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Utilizador inválido" },
      });
    }

    req.user = {
      id: user.id,
      username: user.username,
      roles: user.roles.map((r) => r.role),
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: "INVALID_TOKEN", message: "Token inválido ou expirado" },
    });
  }
};
```

### Middleware de Autorização (Roles)

```typescript
// src/middleware/role.middleware.ts
import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";

export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Não autenticado" },
      });
    }

    const hasRole = req.user.roles.some((role) => roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Sem permissão para esta ação" },
      });
    }

    next();
  };
};

// Uso:
// router.get('/admin/users', authenticate, requireRole('ADMIN'), controller);
// router.get('/moderator/queue', authenticate, requireRole('MODERATOR', 'ADMIN'), controller);
```

---

## Validação

### Schemas Zod

```typescript
// src/schemas/auth.schema.ts
import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(30, "Máximo 30 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Apenas letras, números e underscore"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Deve conter uma maiúscula")
    .regex(/[a-z]/, "Deve conter uma minúscula")
    .regex(/[0-9]/, "Deve conter um número"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Password obrigatória"),
});
```

```typescript
// src/schemas/post.schema.ts
import { z } from "zod";

export const createPostSchema = z.object({
  title: z
    .string()
    .min(10, "Mínimo 10 caracteres")
    .max(200, "Máximo 200 caracteres"),
  content: z.string().min(30, "Mínimo 30 caracteres"),
  tagIds: z
    .array(z.string().uuid())
    .min(1, "Selecione pelo menos 1 tag")
    .max(5, "Máximo 5 tags"),
});
```

### Middleware de Validação

```typescript
// src/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Dados inválidos",
          details: result.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
      });
    }

    req.body = result.data;
    next();
  };
};
```

---

## Sistema de Reputação

### Pontuação

| Ação                           | Pontos |
| ------------------------------ | ------ |
| Receber upvote em post         | +10    |
| Receber downvote em post       | -2     |
| Receber upvote em comentário   | +5     |
| Receber downvote em comentário | -1     |
| Resposta aceite                | +25    |
| Aceitar resposta de outro      | +2     |

### Níveis

| Nível        | Pontos Mínimos |
| ------------ | -------------- |
| Novato       | 0              |
| Contribuidor | 100            |
| Expert       | 500            |
| Guru         | 1000           |

### Serviço de Reputação

```typescript
// src/services/reputation.service.ts
import { prisma } from "../config/database";
import { UserLevel } from "@prisma/client";

export class ReputationService {
  private static LEVELS: { level: UserLevel; minRep: number }[] = [
    { level: "GURU", minRep: 1000 },
    { level: "EXPERT", minRep: 500 },
    { level: "CONTRIBUIDOR", minRep: 100 },
    { level: "NOVATO", minRep: 0 },
  ];

  static async updateReputation(userId: string, change: number): Promise<void> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        reputation: { increment: change },
      },
    });

    // Atualizar nível se necessário
    const newLevel = this.calculateLevel(user.reputation);
    if (newLevel !== user.level) {
      await prisma.user.update({
        where: { id: userId },
        data: { level: newLevel },
      });
    }
  }

  static calculateLevel(reputation: number): UserLevel {
    for (const { level, minRep } of this.LEVELS) {
      if (reputation >= minRep) return level;
    }
    return "NOVATO";
  }
}
```

---

## Notificações

### Tipos e Gatilhos

| Tipo       | Gatilho                               |
| ---------- | ------------------------------------- |
| `COMMENT`  | Novo comentário no post do utilizador |
| `REPLY`    | Resposta ao comentário do utilizador  |
| `VOTE`     | Agregação de votos recebidos          |
| `ACCEPTED` | Resposta aceite pelo autor            |
| `MENTION`  | Menção @username                      |
| `SYSTEM`   | Notificação administrativa            |

### Serviço de Notificações

```typescript
// src/services/notification.service.ts
import { prisma } from "../config/database";
import { NotificationType } from "@prisma/client";

export class NotificationService {
  static async create(params: {
    userId: string;
    type: NotificationType;
    message: string;
    relatedPostId?: string;
    relatedCommentId?: string;
    senderId?: string;
  }): Promise<void> {
    await prisma.notification.create({
      data: params,
    });
  }

  static async notifyComment(
    postAuthorId: string,
    commenterUsername: string,
    postId: string,
    commentId: string
  ): Promise<void> {
    await this.create({
      userId: postAuthorId,
      type: "COMMENT",
      message: `${commenterUsername} comentou no teu post`,
      relatedPostId: postId,
      relatedCommentId: commentId,
    });
  }

  static async notifyAccepted(
    commentAuthorId: string,
    postId: string,
    commentId: string
  ): Promise<void> {
    await this.create({
      userId: commentAuthorId,
      type: "ACCEPTED",
      message: "A tua resposta foi aceite!",
      relatedPostId: postId,
      relatedCommentId: commentId,
    });
  }

  // Agregação de votos (executar via cron job)
  static async aggregateVotes(): Promise<void> {
    // Implementar lógica para agregar votos
    // e enviar notificações consolidadas
  }
}
```

---

## Upload de Ficheiros

### Configuração Multer

```typescript
// src/config/multer.ts
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || "./uploads");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || "")
    .split(",")
    .map((t) => t.trim());

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de ficheiro não permitido"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880"),
  },
});
```

### Processamento de Imagens

```typescript
// src/services/upload.service.ts
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

export class UploadService {
  static async processAvatar(
    filePath: string,
    userId: string
  ): Promise<string> {
    const outputDir = path.join(process.env.UPLOAD_DIR!, "avatars");
    await fs.mkdir(outputDir, { recursive: true });

    const filename = `${userId}.webp`;
    const outputPath = path.join(outputDir, filename);

    await sharp(filePath)
      .resize(200, 200, { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Remover ficheiro original
    await fs.unlink(filePath);

    return `/uploads/avatars/${filename}`;
  }
}
```

---

## Testes

### Configuração Jest

```typescript
// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
```

### Exemplo de Teste de Integração

```typescript
// tests/integration/auth.test.ts
import request from "supertest";
import { app } from "../../src/app";
import { prisma } from "../../src/config/database";

describe("Auth API", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe("POST /api/auth/register", () => {
    it("deve registar um novo utilizador", async () => {
      const response = await request(app).post("/api/auth/register").send({
        username: "testuser",
        email: "test@example.com",
        password: "Password123",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe("testuser");
    });

    it("deve rejeitar email duplicado", async () => {
      await request(app).post("/api/auth/register").send({
        username: "user1",
        email: "test@example.com",
        password: "Password123",
      });

      const response = await request(app).post("/api/auth/register").send({
        username: "user2",
        email: "test@example.com",
        password: "Password123",
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });
});
```

---

## Deploy

### Checklist de Produção

- [ ] Variáveis de ambiente configuradas
- [ ] SSL/TLS ativo
- [ ] Rate limiting configurado
- [ ] Logging estruturado
- [ ] Monitorização (health checks)
- [ ] Backups de base de dados
- [ ] Migrações executadas
- [ ] CORS configurado
- [ ] Helmet.js para headers de segurança

### Comandos

```bash
# Build
npm run build

# Migrações
npx prisma migrate deploy

# Iniciar
npm start

# Health check endpoint
GET /health
```

### Docker Produção

```bash
# Build
docker build -t alldev-api:latest .

# Run
docker run -d \
  --name alldev-api \
  -p 3000:3000 \
  --env-file .env.production \
  alldev-api:latest
```

---

## Resumo de Implementação

### Prioridades

1. **Fase 1 - Essencial:**

   - Autenticação (registo, login, JWT)
   - CRUD de Posts e Comentários
   - Sistema de Tags
   - Perfil de utilizador básico

2. **Fase 2 - Importante:**

   - Sistema de votação
   - Reputação e níveis
   - Respostas aceites
   - Pesquisa

3. **Fase 3 - Complementar:**
   - Notificações
   - Denúncias
   - Painel de administração
   - Painel de moderação
   - Modo de manutenção

### Contacto

Para dúvidas sobre esta documentação, contactar a equipa de desenvolvimento frontend.

---

_Documentação de Backend v1.0_
_Última atualização: Dezembro 2025_
