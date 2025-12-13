# Alldev Backend API

## Setup Inicial

### 1. Criar ficheiro .env

Copie `.env.example` para `.env` e configure as variáveis:

```bash
cp .env.example .env
```

**Variáveis obrigatórias:**
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Chave secreta para JWT (mínimo 32 caracteres)
- `JWT_REFRESH_SECRET`: Chave secreta para refresh tokens (mínimo 32 caracteres)
- `AWS_ACCESS_KEY_ID`: Credenciais AWS para S3
- `AWS_SECRET_ACCESS_KEY`: Credenciais AWS para S3

### 2. Instalar Dependências

```bash
npm install
```

### 3. Rodar Docker (PostgreSQL + Redis)

```bash
docker-compose up -d
```

### 4. Executar Migrações

```bash
npm run prisma:migrate
```

### 5. Popular Base de Dados (Seed)

```bash
npm run prisma:seed
```

**Credenciais de teste criadas:**
- Admin: `admin@alldev.com` / `admin123`
- Moderador: `moderator@alldev.com` / `moderator123`
- User: `user@alldev.com` / `user123`

### 6. Iniciar Servidor

```bash
npm run dev
```

Servidor disponível em: `http://localhost:3001`

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev                  # Iniciar servidor em modo desenvolvimento
npm run build                # Build para produção
npm start                    # Iniciar servidor de produção

# Prisma
npm run prisma:generate      # Gerar Prisma Client
npm run prisma:migrate       # Criar e aplicar migração
npm run prisma:studio        # Abrir Prisma Studio
npm run prisma:seed          # Executar seed

# Testes
npm test                     # Rodar testes
npm run test:watch           # Testes em watch mode
npm run test:coverage        # Cobertura de testes

# Linting
npm run lint                 # Verificar código
npm run lint:fix             # Corrigir automaticamente
```

## API Endpoints

### Autenticação
- `POST /api/auth/register` - Registar novo utilizador
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar access token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Recuperar password
- `POST /api/auth/reset-password` - Redefinir password
- `POST /api/auth/verify-email` - Verificar email
- `POST /api/auth/change-password` - Alterar password (autenticado)

### Utilizadores
- `GET /api/users/me` - Perfil do utilizador (autenticado)
- `PATCH /api/users/me` - Atualizar perfil (autenticado)
- `POST /api/users/me/avatar` - Upload avatar (autenticado)
- `DELETE /api/users/me/avatar` - Remover avatar (autenticado)
- `GET /api/users/:username` - Perfil público
- `GET /api/users/:username/posts` - Posts do utilizador

### Posts
- `GET /api/posts` - Listar posts (query: page, limit, filter, tag, author)
- `GET /api/posts/:slug` - Detalhes do post
- `POST /api/posts` - Criar post (autenticado)
- `PATCH /api/posts/:id` - Atualizar post (autenticado, autor/admin)
- `DELETE /api/posts/:id` - Eliminar post (autenticado, autor/admin)

### Tags
- `GET /api/tags` - Listar tags (query: sort, search)
- `GET /api/tags/:slug` - Detalhes da tag
- `POST /api/tags` - Criar tag (admin)
- `PATCH /api/tags/:id` - Atualizar tag (admin)
- `DELETE /api/tags/:id` - Eliminar tag (admin)

## Health Check

```bash
curl http://localhost:3001/health
```

## Variáveis de Ambiente

Ver `.env.example` para lista completa de variáveis configuráveis.

