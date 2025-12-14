import { z } from 'zod';

export const updateContactStatusSchema = z.object({
  status: z.enum(['PENDING', 'READ', 'REPLIED', 'ARCHIVED'], {
    errorMap: () => ({ message: 'Status inválido.' }),
  }),
});

export const sendReplySchema = z.object({
  replyMessage: z
    .string()
    .min(10, 'A resposta deve ter no mínimo 10 caracteres.')
    .max(5000, 'A resposta deve ter no máximo 5000 caracteres.')
    .trim(),
});

export type UpdateContactStatusDto = z.infer<typeof updateContactStatusSchema>;
export type SendReplyDto = z.infer<typeof sendReplySchema>;

