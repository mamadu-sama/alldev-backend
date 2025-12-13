import { z } from 'zod';

export const createPostSchema = z.object({
  title: z
    .string()
    .min(10, 'Título deve ter no mínimo 10 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  content: z.string().min(30, 'Conteúdo deve ter no mínimo 30 caracteres'),
  tagIds: z
    .array(z.string().uuid('ID de tag inválido'))
    .min(1, 'Selecione pelo menos 1 tag')
    .max(5, 'Máximo 5 tags'),
});

export const updatePostSchema = z.object({
  title: z
    .string()
    .min(10, 'Título deve ter no mínimo 10 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres')
    .optional(),
  content: z.string().min(30, 'Conteúdo deve ter no mínimo 30 caracteres').optional(),
  tagIds: z
    .array(z.string().uuid('ID de tag inválido'))
    .min(1, 'Selecione pelo menos 1 tag')
    .max(5, 'Máximo 5 tags')
    .optional(),
});

export const getPostsQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  filter: z.enum(['recent', 'votes', 'unanswered']).optional().default('recent'),
  tag: z.string().optional(),
  author: z.string().optional(),
});

