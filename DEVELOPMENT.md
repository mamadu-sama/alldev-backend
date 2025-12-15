# Guia de Desenvolvimento - Alldev Backend

## 📋 Pré-requisitos

- Node.js 20.x LTS
- PostgreSQL 15.x
- Redis 7.x (opcional, mas recomendado)
- Docker & Docker Compose
- AWS S3 (para upload de ficheiros)

## 🚀 Setup Inicial

### 1. Clonar e Instalar Dependências

```bash
cd alldev-backend
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha as variáveis:

```bash
cp .env.example .env
```

**Variáveis obrigatórias:**
- `DATABASE_URL` - Conexão PostgreSQL
- `JWT_SECRET` - Segredo para JWT
- `JWT_REFRESH_SECRET` - Segredo para refresh tokens
- `FRONTEND_URL` - URL do frontend
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME` - AWS S3

### 3. Iniciar Serviços com Docker

```bash
docker-compose up -d
```

Isto inicia PostgreSQL e Redis.

### 4. Executar Migrações

```bash
npx prisma migrate dev
```

### 5. Popular Base de Dados

```bash
npm run seed
```

Cria utilizadores de teste:
- **Admin**: `admin@alldev.com` / `admin123`
- **Moderador**: `mod@alldev.com` / `mod123`
- **User**: `user@alldev.com` / `user123`

### 6. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

Servidor disponível em: `http://localhost:3002`

## 📁 Estrutura do Projeto

```
src/
├── config/          # Configurações (DB, Redis, AWS, Env)
├── controllers/     # Handlers de requisições
├── middleware/      # Auth, Validation, Error, Rate Limiting
├── routes/          # Rotas Express
├── services/        # Lógica de negócio
├── repositories/    # Acesso a dados (Prisma) [se usado]
├── schemas/         # Schemas Zod de validação
├── types/           # Tipos TypeScript
├── utils/           # Helpers (JWT, Password, Slug, Pagination, Logger)
├── app.ts           # Configuração do Express
└── server.ts        # Entry point
```

## 🔑 API Endpoints

### Autenticação (`/auth`)
- `POST /register` - Registar novo utilizador
- `POST /login` - Login
- `POST /refresh` - Renovar access token
- `POST /logout` - Logout
- `POST /forgot-password` - Solicitar reset de password
- `POST /reset-password` - Redefinir password
- `POST /verify-email` - Verificar email
- `POST /change-password` - Alterar password (autenticado)

### Utilizadores (`/users`)
- `GET /me` - Obter perfil atual (autenticado)
- `PATCH /me` - Atualizar perfil (autenticado)
- `POST /me/avatar` - Upload avatar (autenticado)
- `DELETE /me/avatar` - Remover avatar (autenticado)
- `GET /:username` - Obter perfil público
- `GET /:username/posts` - Posts do utilizador

### Posts (`/posts`)
- `GET /` - Listar posts (filtros: filter, tag, page, limit)
- `GET /:slug` - Obter post por slug
- `POST /` - Criar post (autenticado)
- `PATCH /:id` - Editar post (autenticado, autor)
- `DELETE /:id` - Deletar post (autenticado, autor)

### Comentários
- `GET /posts/:postId/comments` - Listar comentários
- `POST /posts/:postId/comments` - Criar comentário (autenticado)
- `PATCH /comments/:commentId` - Editar comentário (autenticado, autor)
- `DELETE /comments/:commentId` - Deletar comentário (autenticado, autor)
- `POST /comments/:commentId/accept` - Aceitar resposta (autenticado, autor do post)

### Votação (`/votes`)
- `POST /` - Votar em post ou comentário (autenticado)

### Tags (`/tags`)
- `GET /` - Listar tags (sort: popular, name, new)
- `GET /:slug` - Obter tag por slug
- `POST /` - Criar tag (admin)
- `PATCH /:id` - Editar tag (admin)
- `DELETE /:id` - Deletar tag (admin)

### Notificações (`/notifications`)
- `GET /` - Listar notificações (autenticado)
- `PATCH /:id/read` - Marcar como lida (autenticado)
- `POST /read-all` - Marcar todas como lidas (autenticado)

### Pesquisa (`/search`)
- `GET /` - Pesquisa global (posts, tags, users)
- `GET /posts` - Pesquisar posts
- `GET /autocomplete` - Autocomplete (tags ou users)

### Denúncias (`/reports`)
- `POST /` - Criar denúncia (autenticado)
- `GET /` - Listar denúncias (moderador/admin)
- `PATCH /:id` - Atualizar status (moderador/admin)

### Moderação (`/moderator`)
- `POST /posts/:id/hide` - Ocultar post (moderador/admin)
- `POST /posts/:id/unhide` - Restaurar post (moderador/admin)
- `POST /posts/:id/lock` - Bloquear post (moderador/admin)
- `POST /posts/:id/unlock` - Desbloquear post (moderador/admin)
- `POST /comments/:id/hide` - Ocultar comentário (moderador/admin)
- `POST /comments/:id/unhide` - Restaurar comentário (moderador/admin)
- `GET /actions` - Log de ações de moderação (moderador/admin)

### Administração (`/admin`)
- `GET /users` - Listar todos utilizadores (admin)
- `PATCH /users/:id/role` - Alterar roles (admin)
- `POST /users/:id/ban` - Banir utilizador (admin)
- `POST /users/:id/unban` - Desbanir utilizador (admin)
- `DELETE /users/:id` - Deletar utilizador (admin)
- `GET /maintenance` - Obter modo manutenção (admin)
- `POST /maintenance` - Atualizar modo manutenção (admin)
- `GET /statistics` - Estatísticas da plataforma (admin)

## 🔒 Sistema de Permissões

### Roles
- **USER** - Utilizador normal
- **MODERATOR** - Moderador (pode ocultar/bloquear conteúdo)
- **ADMIN** - Administrador (todos os privilégios)

### Middleware
- `authenticate` - Verifica JWT
- `requireRole([roles])` - Verifica se user tem uma das roles especificadas

## 💯 Sistema de Reputação

### Pontos por Ação
- Upvote no post: **+10 pontos**
- Downvote no post: **-2 pontos**
- Upvote no comentário: **+5 pontos**
- Downvote no comentário: **-1 ponto**
- Resposta aceite: **+25 pontos**
- Aceitar resposta: **+2 pontos**

### Níveis
- **NOVATO**: 0-99 pontos
- **CONTRIBUIDOR**: 100-499 pontos
- **EXPERT**: 500-999 pontos
- **GURU**: 1000+ pontos

## 📧 Notificações

Tipos de notificações:
- **COMMENT** - Novo comentário no seu post
- **REPLY** - Resposta ao seu comentário
- **VOTE** - Votos agregados (batch)
- **ACCEPTED** - Sua resposta foi aceite
- **MENTION** - Menção @username
- **SYSTEM** - Notificação administrativa

## 📤 Upload de Ficheiros

### Avatares
- **Tamanho máximo**: 2MB
- **Formatos**: JPEG, PNG, WebP
- **Processamento**: Resize para 200x200, conversão para WebP
- **Armazenamento**: AWS S3

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes em watch mode
npm run test:watch

# Cobertura
npm run test:coverage
```

## 📊 Logging

- **Winston** para logging estruturado
- Níveis: error, warn, info, http, debug
- Formato JSON em produção
- Logs salvos em `logs/`

## 🐳 Docker

### Desenvolvimento
```bash
docker-compose up -d  # Inicia PostgreSQL e Redis
```

### Produção
```bash
docker build -t alldev-backend .
docker run -p 3002:3002 --env-file .env alldev-backend
```

## 🚀 Deploy

### Pré-Deploy Checklist
- [ ] Variáveis de ambiente configuradas
- [ ] Migrações executadas (`npx prisma migrate deploy`)
- [ ] SSL/TLS ativo
- [ ] Rate limiting configurado
- [ ] CORS configurado para domínio correto
- [ ] Backups de DB configurados
- [ ] Logging estruturado ativo
- [ ] Health checks funcionando (`/health`)
- [ ] Monitorização ativa

### Comandos de Deploy
```bash
# Build para produção
npm run build

# Executar em produção
npm start
```

## 🔧 Manutenção

### Limpar notificações antigas
```typescript
import { NotificationService } from '@/services/notification.service';
await NotificationService.deleteOldNotifications(30); // Older than 30 days
```

### Backup de Base de Dados
```bash
docker exec -t alldev-db pg_dumpall -c -U postgres > dump_`date +%Y-%m-%d"_"%H_%M_%S`.sql
```

## 📚 Recursos

- [Express.js](https://expressjs.com/)
- [Prisma](https://www.prisma.io/docs/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zod](https://zod.dev/)
- [Winston](https://github.com/winstonjs/winston)
- [JWT](https://jwt.io/)

## 🐛 Troubleshooting

### Porta já em uso
```bash
# Encontrar processo
lsof -i :3002

# Matar processo
kill -9 <PID>
```

### Erro de migração
```bash
# Reset database (⚠️ apaga todos os dados)
npx prisma migrate reset

# Aplicar migrações manualmente
npx prisma migrate deploy
```

### Erro de conexão Redis
- Verificar se Redis está a correr: `docker ps`
- Reiniciar: `docker-compose restart redis`

## 📞 Suporte

Para questões ou problemas, consulte a documentação ou contacte a equipa de desenvolvimento.



