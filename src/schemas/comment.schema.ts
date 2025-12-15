import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().min(10, 'Comentário deve ter no mínimo 10 caracteres'),
  parentId: z.string().uuid().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(10, 'Comentário deve ter no mínimo 10 caracteres'),
});

export const getCommentsQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
});



