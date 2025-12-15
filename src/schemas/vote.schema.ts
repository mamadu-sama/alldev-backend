import { z } from 'zod';

export const voteSchema = z.object({
  type: z.enum(['up', 'down'], {
    errorMap: () => ({ message: 'Tipo de voto deve ser "up" ou "down"' }),
  }),
  postId: z.string().uuid().optional(),
  commentId: z.string().uuid().optional(),
}).refine((data) => data.postId || data.commentId, {
  message: 'Deve fornecer postId ou commentId',
}).refine((data) => !(data.postId && data.commentId), {
  message: 'Não pode votar em post e comentário simultaneamente',
});



