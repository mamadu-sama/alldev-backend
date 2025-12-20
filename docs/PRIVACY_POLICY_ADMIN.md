# Gestão da Política de Privacidade - Painel de Admin

Este documento descreve as APIs disponíveis para gerenciar a Política de Privacidade da plataforma Alldev.

## 🔐 Permissões

Apenas usuários com os seguintes roles podem gerenciar a Política de Privacidade:

- **ADMIN** ✅
- **MODERATOR** ✅
- USER ❌ (apenas visualização pública)

## 📋 Endpoints Disponíveis

### 1. Visualizar Política de Privacidade (Público)

```http
GET /api/privacy-policy
```

**Autenticação:** Não requerida
**Permissões:** Público

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "lastUpdated": "2025-12-18T21:00:00.000Z",
    "dataCollectionUserProvided": "...",
    "dataCollectionAutomatic": "...",
    "dataCollectionThirdParty": "...",
    "dataUsageDescription": "...",
    "dataSharingDescription": "...",
    "dataSharingImportantNote": "...",
    "securityMeasures": "...",
    "securityDisclaimer": "...",
    "dataRetentionDescription": "...",
    "lgpdRightsDescription": "...",
    "lgpdContactInfo": "...",
    "minorsPolicy": "...",
    "internationalTransfers": "...",
    "accountDeletionDescription": "...",
    "accountDeletionProcess": "...",
    "dpoName": "João Silva",
    "dpoEmail": "privacidade@alldev.com.br",
    "dpoContactPage": "alldev.com.br/contato",
    "updatedBy": "user-id"
  }
}
```

---

### 2. Obter Conteúdo para Edição (Admin/Moderator)

```http
GET /api/privacy-policy/admin
```

**Autenticação:** Bearer Token (JWT)
**Permissões:** ADMIN, MODERATOR

**Headers:**

```
Authorization: Bearer {access_token}
```

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "lastUpdated": "2025-12-18T21:00:00.000Z",
    "dataCollectionUserProvided": "...",
    // ... todos os campos ...
    "updatedBy": "user-id",
    "updatedByUser": {
      "id": "user-id",
      "username": "admin",
      "email": "admin@alldev.com",
      "avatarUrl": "https://..."
    }
  }
}
```

---

### 3. Atualizar Política de Privacidade (Admin/Moderator)

```http
PATCH /api/privacy-policy/admin
```

**Autenticação:** Bearer Token (JWT)
**Permissões:** ADMIN, MODERATOR

**Headers:**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body (todos os campos são opcionais):**

```json
{
  "dataCollectionUserProvided": "Texto atualizado...",
  "dataCollectionAutomatic": "Texto atualizado...",
  "dataCollectionThirdParty": "Texto atualizado...",
  "dataUsageDescription": "Texto atualizado...",
  "dataSharingDescription": "Texto atualizado...",
  "dataSharingImportantNote": "Texto atualizado...",
  "securityMeasures": "Texto atualizado...",
  "securityDisclaimer": "Texto atualizado...",
  "dataRetentionDescription": "Texto atualizado...",
  "lgpdRightsDescription": "Texto atualizado...",
  "lgpdContactInfo": "Texto atualizado...",
  "minorsPolicy": "Texto atualizado...",
  "internationalTransfers": "Texto atualizado...",
  "accountDeletionDescription": "Texto atualizado...",
  "accountDeletionProcess": "Texto atualizado...",
  "dpoName": "Maria Santos",
  "dpoEmail": "privacidade@alldev.com.br",
  "dpoContactPage": "alldev.com.br/contato",
  "changeDescription": "Atualização das seções de LGPD e cookies"
}
```

**Validação:**

- Todos os campos de texto: mínimo 10 caracteres
- `dpoName`: mínimo 2 caracteres
- `dpoEmail`: formato de email válido
- `dpoContactPage`: mínimo 5 caracteres
- `changeDescription`: mínimo 10, máximo 500 caracteres (opcional)

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "lastUpdated": "2025-12-18T21:30:00.000Z",
    // ... conteúdo atualizado ...
    "updatedBy": "user-id",
    "updatedByUser": {
      "id": "user-id",
      "username": "moderator1",
      "email": "mod@alldev.com",
      "avatarUrl": "https://..."
    }
  },
  "message": "Conteúdo da Política de Privacidade atualizado com sucesso"
}
```

**Erros Possíveis:**

- `400 Bad Request`: Dados de validação inválidos
- `401 Unauthorized`: Token inválido ou expirado
- `403 Forbidden`: Usuário sem permissão (não é ADMIN ou MODERATOR)
- `404 Not Found`: Conteúdo não encontrado

---

### 4. Obter Histórico de Alterações (Admin/Moderator)

```http
GET /api/privacy-policy/admin/history?page=1&limit=20
```

**Autenticação:** Bearer Token (JWT)
**Permissões:** ADMIN, MODERATOR

**Headers:**

```
Authorization: Bearer {access_token}
```

**Query Parameters:**

- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20)

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "history-uuid-1",
      "contentId": "content-uuid",
      "updatedAt": "2025-12-18T20:00:00.000Z",
      "changeDescription": "Atualização das seções de LGPD",
      "dataCollectionUserProvided": "...",
      "dataCollectionAutomatic": "...",
      // ... snapshot completo dos dados ...
      "updatedBy": "user-id",
      "updatedByUser": {
        "id": "user-id",
        "username": "admin",
        "email": "admin@alldev.com",
        "avatarUrl": "https://..."
      }
    },
    {
      "id": "history-uuid-2",
      "contentId": "content-uuid",
      "updatedAt": "2025-12-17T15:00:00.000Z",
      "changeDescription": "Correção de informações de contato",
      // ... snapshot completo ...
      "updatedByUser": {
        "id": "moderator-id",
        "username": "moderator1",
        "email": "mod@alldev.com",
        "avatarUrl": "https://..."
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasMore": true
  }
}
```

---

### 5. Seed Conteúdo Padrão (Admin/Moderator)

```http
POST /api/privacy-policy/admin/seed
```

⚠️ **ATENÇÃO:** Este endpoint só deve ser usado se não houver conteúdo no banco de dados.

**Autenticação:** Bearer Token (JWT)
**Permissões:** ADMIN, MODERATOR

**Headers:**

```
Authorization: Bearer {access_token}
```

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "message": "Conteúdo padrão criado com sucesso"
}
```

**Se já existir conteúdo:**

```json
{
  "success": true,
  "message": "Conteúdo já existe"
}
```

---

## 🔄 Fluxo de Trabalho Típico

### Atualizando a Política de Privacidade

1. **Obter conteúdo atual para edição:**

   ```bash
   GET /api/privacy-policy/admin
   ```

2. **Editar campos necessários no frontend**

3. **Enviar atualização:**

   ```bash
   PATCH /api/privacy-policy/admin
   {
     "dataCollectionUserProvided": "Novo texto...",
     "changeDescription": "Atualização da seção de coleta de dados"
   }
   ```

4. **Verificar histórico de alterações:**
   ```bash
   GET /api/privacy-policy/admin/history?page=1&limit=10
   ```

---

## 📝 Exemplos de Uso com cURL

### 1. Login como Admin

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@alldev.com",
    "password": "senha123"
  }'
```

**Resposta:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1...",
    "refreshToken": "eyJhbGciOiJIUzI1...",
    "user": {
      "id": "user-id",
      "username": "admin",
      "email": "admin@alldev.com",
      "roles": ["ADMIN"]
    }
  }
}
```

### 2. Obter Conteúdo para Edição

```bash
curl -X GET http://localhost:5000/api/privacy-policy/admin \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1..."
```

### 3. Atualizar Seção da DPO

```bash
curl -X PATCH http://localhost:5000/api/privacy-policy/admin \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1..." \
  -H "Content-Type: application/json" \
  -d '{
    "dpoName": "Maria Santos",
    "dpoEmail": "privacidade@alldev.com.br",
    "changeDescription": "Atualização dos dados da DPO"
  }'
```

### 4. Obter Histórico

```bash
curl -X GET "http://localhost:5000/api/privacy-policy/admin/history?page=1&limit=5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1..."
```

---

## 🛡️ Segurança

### Auditoria

- ✅ Todas as alterações são registradas no histórico
- ✅ Cada alteração inclui: quem fez, quando fez, e o que mudou
- ✅ Snapshots completos do estado anterior são mantidos
- ✅ Descrição opcional das mudanças para facilitar auditoria

### Controle de Acesso

- ✅ Apenas ADMIN e MODERATOR podem editar
- ✅ Token JWT obrigatório
- ✅ Middleware de autenticação e autorização
- ✅ Validação de dados com Zod

### Logs

- ✅ Logs de console registram todas as atualizações
- ✅ Incluem: userId, username, contentId, changeDescription, timestamp

---

## 📊 Estrutura dos Dados

### Seções da Política de Privacidade

1. **Dados que Coletamos**

   - `dataCollectionUserProvided`: Dados fornecidos pelo usuário
   - `dataCollectionAutomatic`: Dados coletados automaticamente
   - `dataCollectionThirdParty`: Dados de terceiros

2. **Como Usamos Seus Dados**

   - `dataUsageDescription`: Descrição de uso dos dados

3. **Compartilhamento de Dados**

   - `dataSharingDescription`: Como compartilhamos dados
   - `dataSharingImportantNote`: Nota importante sobre compartilhamento

4. **Segurança dos Dados**

   - `securityMeasures`: Medidas de segurança implementadas
   - `securityDisclaimer`: Aviso sobre limitações de segurança

5. **Retenção de Dados**

   - `dataRetentionDescription`: Quanto tempo mantemos os dados

6. **Seus Direitos LGPD**

   - `lgpdRightsDescription`: Direitos do usuário segundo LGPD
   - `lgpdContactInfo`: Como exercer seus direitos

7. **Menores de Idade**

   - `minorsPolicy`: Política para menores de 16 anos

8. **Transferências Internacionais**

   - `internationalTransfers`: Informações sobre transferência de dados

9. **Exclusão de Conta**

   - `accountDeletionDescription`: Descrição do processo
   - `accountDeletionProcess`: Passos do processo

10. **Contato e DPO**
    - `dpoName`: Nome do Encarregado de Proteção de Dados
    - `dpoEmail`: Email para contato
    - `dpoContactPage`: Página de contato

---

## 🚀 Próximos Passos

Para integrar no frontend:

1. Criar página de gestão em `/admin/privacy-policy`
2. Formulário com campos editáveis
3. Preview das alterações antes de salvar
4. Página de histórico com diff visual
5. Confirmação antes de salvar alterações importantes

---

## 💡 Dicas

- Use `changeDescription` para documentar o motivo da alteração
- Revise o histórico periodicamente para auditoria
- Teste sempre em ambiente de desenvolvimento primeiro
- Mantenha backups regulares do banco de dados
- Considere notificar usuários de mudanças significativas

---

**Última atualização:** 18/12/2025
**Versão da API:** 1.0.0
