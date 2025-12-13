import { z } from 'zod';

export const createReportSchema = z.object({
  reason: z.enum(['SPAM', 'INAPPROPRIATE', 'OFFENSIVE', 'MISINFORMATION', 'OTHER'], {
    errorMap: () => ({ message: 'Motivo inválido' }),
  }),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres').max(500),
  postId: z.string().uuid().optional(),
  commentId: z.string().uuid().optional(),
}).refine((data) => data.postId || data.commentId, {
  message: 'Deve fornecer postId ou commentId',
}).refine((data) => !(data.postId && data.commentId), {
  message: 'Não pode denunciar post e comentário simultaneamente',
});

export const updateReportStatusSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED'], {
    errorMap: () => ({ message: 'Status inválido' }),
  }),
  resolution: z.string().optional(),
});


