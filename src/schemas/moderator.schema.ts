import { z } from 'zod';
import { ModeratorActionType } from '@prisma/client';

export const takeActionSchema = z.object({
  targetId: z.string().uuid('ID do alvo inválido.'),
  targetType: z.enum(['POST', 'COMMENT'], {
    errorMap: () => ({ message: 'Tipo de alvo inválido.' }),
  }),
  actionType: z.nativeEnum(ModeratorActionType, {
    errorMap: () => ({ message: 'Tipo de ação inválido.' }),
  }),
  reason: z.string().min(3, 'Motivo deve ter no mínimo 3 caracteres.').max(500).optional(),
  notes: z.string().max(1000, 'Notas devem ter no máximo 1000 caracteres.').optional(),
});

export type TakeActionDto = z.infer<typeof takeActionSchema>;

