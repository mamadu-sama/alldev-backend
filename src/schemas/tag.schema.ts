import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(30, 'Nome deve ter no máximo 30 caracteres'),
  description: z.string().max(200, 'Descrição deve ter no máximo 200 caracteres').optional(),
});

export const updateTagSchema = z.object({
  name: z.string().min(2).max(30).optional(),
  description: z.string().max(200).optional(),
});

export const getTagsQuerySchema = z.object({
  sort: z.enum(['popular', 'alphabetical']).optional().default('popular'),
  search: z.string().optional(),
});

