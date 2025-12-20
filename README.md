# Alldev - Documentação do Backend

## 📋 Índice

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Stack Tecnológica](#stack-tecnológica)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Funcionalidades](#funcionalidades)
5. [API Endpoints](#api-endpoints)
6. [Autenticação & Autorização](#autenticação--autorização)
7. [Base de Dados](#base-de-dados)
8. [Deployment](#deployment)
9. [Desenvolvimento](#desenvolvimento)
10. [Contacto](#contacto)

---

## 🎯 Visão Geral do Projeto

**Alldev Backend** é a API REST que alimenta a plataforma de comunidade Alldev. Construída com Node.js, Express, TypeScript e Prisma, fornece todos os serviços necessários para gestão de utilizadores, posts, comentários, votação, notificações e muito mais.

### Características Principais

- ✅ **API RESTful** - Endpoints bem estruturados e documentados
- ✅ **Autenticação JWT** - Tokens seguros com refresh tokens
- ✅ **OAuth 2.0** - Integração com Google e GitHub
- ✅ **Sistema de Permissões** - Roles (User, Moderator, Admin)
- ✅ **Upload de Ficheiros** - Suporte para imagens (AWS S3)
- ✅ **Rate Limiting** - Proteção contra abuso
- ✅ **Validação de Dados** - Schemas Zod
- ✅ **Email Transacional** - Nodemailer (SMTP)
- ✅ **Caching** - Redis para performance
- ✅ **Logging** - Winston para monitorização
- ✅ **Testes** - Jest para testes unitários

---

## 🛠 Stack Tecnológica

### Core

| Tecnologia     | Versão  | Finalidade                |
| -------------- | ------- | ------------------------- |
| **Node.js**    | 20+     | Runtime JavaScript        |
| **TypeScript** | 5.x     | Tipagem Estática          |
| **Express**    | 4.21.2  | Framework Web             |
| **Prisma**     | 6.2.1   | ORM & Query Builder       |
| **PostgreSQL** | 15      | Base de Dados Relacional  |
| **Redis**      | 7       | Cache & Session Store     |

### Autenticação & Segurança

| Biblioteca       | Versão  | Finalidade                |
| ---------------- | ------- | ------------------------- |
| **jsonwebtoken** | 9.0.2   | JWT Tokens                |
| **bcryptjs**     | 2.4.3   | Hash de Passwords         |
| **passport**     | 0.7.0   | Estratégias de Auth       |
| **passport-google-oauth20** | 2.0.0 | OAuth Google |
| **passport-github2** | 0.1.12 | OAuth GitHub |
| **helmet**       | 8.0.0   | Headers de Segurança      |
| **cors**         | 2.8.5   | Cross-Origin Resource Sharing |
| **express-rate-limit** | 7.5.0 | Rate Limiting |

### Validação & Utilitários

| Biblioteca    | Versão  | Finalidade              |
| ------------- | ------- | ----------------------- |
| **zod**       | 3.25.76 | Validação de Schemas    |
| **date-fns**  | 4.1.0   | Manipulação de Datas    |
| **slugify**   | 1.6.6   | Geração de Slugs        |

### Upload & Storage

| Biblioteca     | Versão   | Finalidade           |
| -------------- | -------- | -------------------- |
| **multer**     | 1.4.5-lts.1 | Upload de Ficheiros |
| **@aws-sdk/client-s3** | 3.632.0 | AWS S3 Integration |

### Email

| Biblioteca    | Versão | Finalidade         |
| ------------- | ------ | ------------------ |
| **nodemailer** | 6.9.16 | Envio de Emails   |

### Logging & Monitoring

| Biblioteca | Versão | Finalidade |
| ---------- | ------ | ---------- |
| **winston** | 3.17.0 | Logging   |
| **morgan**  | 1.10.0 | HTTP Logging |

### Desenvolvimento

| Biblioteca       | Versão | Finalidade           |
| ---------------- | ------ | -------------------- |
| **ts-node-dev**  | 2.0.0  | Dev Server com Hot Reload |
| **jest**         | 29.7.0 | Framework de Testes  |
| **eslint**       | 9.18.0 | Linting TypeScript   |
| **tsc-alias**    | 1.8.10 | Path Aliases         |

---

## 📁 Estrutura do Projeto

```
alldev-backend/
├── prisma/
│   ├── schema.prisma        # Schema da base de dados
│   ├── seed.ts              # Script de seed
│   └── migrations/          # Migrações SQL
├── src/
│   ├── config/              # Configurações
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── passport.config.ts
│   │   └── email.config.ts
│   ├── controllers/         # Controladores
│   │   ├── auth.controller.ts
│   │   ├── post.controller.ts
│   │   ├── user.controller.ts
│   │   ├── comment.controller.ts
│   │   └── tag.controller.ts
│   ├── middleware/          # Middlewares
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── upload.middleware.ts
│   ├── routes/              # Rotas da API
│   │   ├── auth.routes.ts
│   │   ├── post.routes.ts
│   │   ├── user.routes.ts
│   │   └── index.ts
│   ├── services/            # Lógica de Negócio
│   │   ├── auth.service.ts
│   │   ├── post.service.ts
│   │   ├── email.service.ts
│   │   └── upload.service.ts
│   ├── types/               # Tipos TypeScript
│   │   └── index.ts
│   ├── utils/               # Utilitários
│   │   ├── logger.ts
│   │   └── helpers.ts
│   ├── validators/          # Schemas Zod
│   │   ├── auth.validator.ts
│   │   └── post.validator.ts
│   ├── app.ts               # Configuração Express
│   └── server.ts            # Entry Point
├── scripts/
│   └── deploy.sh            # Script de deployment
├── nginx/                   # Configurações NGINX
│   ├── nginx.conf
│   └── conf.d/
│       └── api.alldev.pt.conf
├── docker-compose.production.yml
├── Dockerfile
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## ✨ Funcionalidades

### 1. Autenticação

- **Registo de Utilizador** (email/password)
- **Login** com JWT
- **Refresh Tokens**
- **OAuth 2.0** (Google, GitHub)
- **Recuperação de Password** (email)
- **Verificação de Email**
- **Logout** (invalidação de token)

### 2. Gestão de Utilizadores

- **Perfis de Utilizador** (avatar, bio, skills, links sociais)
- **Sistema de Reputação** (pontos por contribuições)
- **Níveis** (Novato, Contribuidor, Expert, Guru)
- **Roles** (User, Moderator, Admin)
- **Seguir Utilizadores**

### 3. Posts & Comentários

- **CRUD de Posts** (criar, ler, atualizar, eliminar)
- **Markdown** suportado
- **Sistema de Tags**
- **Comentários** com respostas aninhadas
- **Aceitar Resposta** (marcar solução)
- **Votação** (upvote/downvote)
- **Visualizações** (tracking)

### 4. Pesquisa & Filtros

- **Pesquisa Full-Text** (posts, utilizadores, tags)
- **Filtros** (recentes, mais votados, sem resposta)
- **Ordenação** personalizada
- **Paginação**

### 5. Notificações

- **Notificações em Tempo Real**
- **Tipos**: comentário, resposta, voto, menção, resposta aceite
- **Agregação** de notificações similares
- **Marcar como lida**

### 6. Moderação & Admin

- **Painel Admin** (estatísticas, gestão)
- **Moderação de Conteúdo** (aprovar, rejeitar, eliminar)
- **Gestão de Utilizadores** (banir, alterar roles)
- **Denúncias** (reportar conteúdo)
- **Modo Manutenção**

### 7. Upload de Ficheiros

- **Upload de Imagens** (avatar, posts)
- **Validação** (tipo, tamanho)
- **Storage AWS S3**
- **URLs assinados** para acesso seguro

### 8. Email

- **Emails Transacionais** (verificação, recuperação)
- **Templates HTML**
- **SMTP** configurável

---

## 🔌 API Endpoints

### Autenticação

```
POST   /api/auth/register           # Registo
POST   /api/auth/login              # Login
POST   /api/auth/refresh            # Refresh token
POST   /api/auth/logout             # Logout
POST   /api/auth/forgot-password    # Recuperar password
POST   /api/auth/reset-password     # Redefinir password
GET    /api/auth/verify-email       # Verificar email
GET    /api/oauth/google            # OAuth Google
GET    /api/oauth/google/callback   # Callback Google
GET    /api/oauth/github            # OAuth GitHub
GET    /api/oauth/github/callback   # Callback GitHub
```

### Posts

```
GET    /api/posts                   # Listar posts
GET    /api/posts/:slug             # Detalhes do post
POST   /api/posts                   # Criar post (auth)
PUT    /api/posts/:id               # Atualizar post (auth, autor)
DELETE /api/posts/:id               # Eliminar post (auth, autor/admin)
POST   /api/posts/:id/vote          # Votar (auth)
```

### Comentários

```
GET    /api/posts/:postId/comments  # Listar comentários
POST   /api/posts/:postId/comments  # Criar comentário (auth)
PUT    /api/comments/:id            # Atualizar comentário (auth, autor)
DELETE /api/comments/:id            # Eliminar comentário (auth, autor/admin)
POST   /api/comments/:id/vote       # Votar (auth)
POST   /api/comments/:id/accept     # Aceitar resposta (auth, autor do post)
```

### Utilizadores

```
GET    /api/users/:username         # Perfil público
GET    /api/users/me                # Perfil próprio (auth)
PUT    /api/users/me                # Atualizar perfil (auth)
POST   /api/users/me/avatar         # Upload avatar (auth)
GET    /api/users/:id/posts         # Posts do utilizador
```

### Tags

```
GET    /api/tags                    # Listar tags
GET    /api/tags/:slug              # Detalhes da tag
POST   /api/tags                    # Criar tag (admin)
PUT    /api/tags/:id                # Atualizar tag (admin)
DELETE /api/tags/:id                # Eliminar tag (admin)
POST   /api/tags/:id/follow         # Seguir tag (auth)
```

### Pesquisa

```
GET    /api/search                  # Pesquisa global
GET    /api/search/posts            # Pesquisar posts
GET    /api/search/users            # Pesquisar utilizadores
GET    /api/search/tags             # Pesquisar tags
```

### Notificações

```
GET    /api/notifications           # Listar notificações (auth)
PUT    /api/notifications/:id/read  # Marcar como lida (auth)
PUT    /api/notifications/read-all  # Marcar todas como lidas (auth)
```

### Admin

```
GET    /api/admin/stats             # Estatísticas (admin)
GET    /api/admin/users             # Listar utilizadores (admin)
PUT    /api/admin/users/:id/role    # Alterar role (admin)
DELETE /api/admin/users/:id         # Eliminar utilizador (admin)
GET    /api/admin/reports           # Denúncias (admin/mod)
PUT    /api/admin/maintenance       # Modo manutenção (admin)
```

---

## 🔐 Autenticação & Autorização

### JWT Tokens

- **Access Token**: Válido por 15 minutos
- **Refresh Token**: Válido por 7 dias
- **Armazenamento**: httpOnly cookies (produção)

### Roles & Permissões

| Role       | Permissões                                      |
| ---------- | ----------------------------------------------- |
| **User**   | Criar posts, comentar, votar, editar próprio conteúdo |
| **Moderator** | Moderar conteúdo, gerir denúncias, banir temporariamente |
| **Admin**  | Acesso total, gerir utilizadores, configurações do sistema |

### OAuth 2.0

Estratégias configuradas:
- **Google OAuth** (`passport-google-oauth20`)
- **GitHub OAuth** (`passport-github2`)

---

## 🗄 Base de Dados

### Tecnologia

- **PostgreSQL 15** (produção)
- **Prisma ORM** para queries type-safe

### Schema Principal

```prisma
model User {
  id            String   @id @default(uuid())
  username      String   @unique
  email         String   @unique
  password      String?
  avatarUrl     String?
  bio           String?
  reputation    Int      @default(0)
  roles         Role[]
  posts         Post[]
  comments      Comment[]
  votes         Vote[]
  createdAt     DateTime @default(now())
}

model Post {
  id            String   @id @default(uuid())
  title         String
  content       String
  slug          String   @unique
  authorId      String
  author        User     @relation(fields: [authorId])
  tags          Tag[]
  comments      Comment[]
  votes         Vote[]
  views         Int      @default(0)
  createdAt     DateTime @default(now())
}

model Comment {
  id            String   @id @default(uuid())
  content       String
  postId        String
  post          Post     @relation(fields: [postId])
  authorId      String
  author        User     @relation(fields: [authorId])
  isAccepted    Boolean  @default(false)
  votes         Vote[]
  createdAt     DateTime @default(now())
}
```

### Migrações

```bash
# Criar migração
npm run prisma:migrate

# Aplicar migrações (produção)
npm run prisma:migrate:deploy

# Seed da base de dados
npm run prisma:seed
```

---

## 🚀 Deployment

### Plataforma: VPS (Docker)

**URL da API**: [https://api.alldev.pt](https://api.alldev.pt)

### Arquitetura

```
┌─────────────┐
│   Vercel    │ (Frontend)
│ alldev.pt   │
└──────┬──────┘
       │ /api/* proxy
       ▼
┌─────────────────────────────┐
│         VPS Server          │
│  ┌─────────────────────┐   │
│  │   NGINX (Reverse    │   │
│  │   Proxy + SSL)      │   │
│  └──────────┬──────────┘   │
│             │               │
│  ┌──────────▼──────────┐   │
│  │   Express API       │   │
│  │   (Node.js)         │   │
│  └──────────┬──────────┘   │
│             │               │
│  ┌──────────▼──────────┐   │
│  │   PostgreSQL 15     │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │   Redis 7           │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

### Docker Compose

Serviços:
- **nginx** - Proxy reverso com SSL
- **api** - Aplicação Node.js
- **db** - PostgreSQL
- **redis** - Cache
- **certbot** - Certificados SSL (Let's Encrypt)

### Deployment Automático

Script `scripts/deploy.sh`:

1. **Backup da Base de Dados** (automático)
2. **Build da Imagem Docker**
3. **Push para VPS**
4. **Atualização de Schema** (`prisma db push`)
5. **Restart dos Serviços**

```bash
# Executar deployment
./scripts/deploy.sh
```

### Variáveis de Ambiente

Configuradas em `.env.production` no VPS:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

---

## 💻 Desenvolvimento

### Pré-requisitos

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- npm ou yarn

### Instalação

```bash
# Clonar repositório
git clone https://github.com/yourusername/alldev-community-hub.git
cd alldev-community-hub/alldev-backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com as suas credenciais

# Gerar Prisma Client
npm run prisma:generate

# Executar migrações
npm run prisma:migrate

# Seed da base de dados (opcional)
npm run prisma:seed

# Iniciar servidor de desenvolvimento
npm run dev
```

### Scripts Disponíveis

```bash
npm run dev                   # Dev server (http://localhost:3001)
npm run build                 # Build de produção
npm start                     # Iniciar produção
npm run prisma:generate       # Gerar Prisma Client
npm run prisma:migrate        # Criar migração
npm run prisma:migrate:deploy # Aplicar migrações (prod)
npm run prisma:studio         # Prisma Studio (GUI)
npm run prisma:seed           # Seed da base de dados
npm test                      # Executar testes
npm run test:watch            # Testes em watch mode
npm run test:coverage         # Cobertura de testes
npm run lint                  # Executar ESLint
npm run lint:fix              # Corrigir erros de linting
```

### Estrutura de Desenvolvimento

```typescript
// Exemplo de Controller
export const createPost = async (req: Request, res: Response) => {
  const { title, content, tags } = req.body;
  const userId = req.user.id;

  const post = await postService.create({
    title,
    content,
    tags,
    authorId: userId
  });

  res.status(201).json({ success: true, data: post });
};
```

---

## 📞 Contacto

### Responsável pelo Projeto

**Mamadu Sama**  
📧 Email: [geral@alldev.pt](mailto:geral@alldev.pt)  
🌐 Website: [https://alldev.pt](https://alldev.pt)  
💼 LinkedIn: [linkedin.com/in/mamadusama](https://linkedin.com/in/mamadusama)  
🐙 GitHub: [@mamadu-sama](https://github.com/mamadu-sama)

### Suporte

Para reportar bugs e solicitar funcionalidades, por favor abra uma issue no GitHub ou contacte via email.

---

**Última Atualização**: Dezembro 2025  
**Versão**: 1.0.0  
**Estado**: Produção
