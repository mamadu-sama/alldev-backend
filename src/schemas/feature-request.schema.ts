import { z } from "zod";

export const createFeatureRequestSchema = z.object({
  title: z
    .string()
    .min(10, "Título deve ter no mínimo 10 caracteres")
    .max(200, "Título deve ter no máximo 200 caracteres")
    .trim(),

  description: z
    .string()
    .min(30, "Descrição deve ter no mínimo 30 caracteres")
    .max(5000, "Descrição deve ter no máximo 5000 caracteres")
    .trim(),

  category: z.enum([
    "INTERFACE",
    "FUNCIONALIDADES",
    "INTEGRACOES",
    "COMUNIDADE",
    "NOTIFICACOES",
    "MOBILE",
    "GAMIFICACAO",
    "ACESSIBILIDADE",
    "PERFORMANCE",
    "SEGURANCA",
  ], {
    errorMap: () => ({ message: "Categoria inválida" }),
  }),
});

export const updateFeatureRequestStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "REVIEWING",
    "PLANNED",
    "IN_PROGRESS",
    "COMPLETED",
    "DECLINED",
  ], {
    errorMap: () => ({ message: "Status inválido" }),
  }),
});

export const createFeatureCommentSchema = z.object({
  content: z
    .string()
    .min(10, "Comentário deve ter no mínimo 10 caracteres")
    .max(1000, "Comentário deve ter no máximo 1000 caracteres")
    .trim(),
});

export type CreateFeatureRequestDto = z.infer<typeof createFeatureRequestSchema>;
export type UpdateFeatureRequestStatusDto = z.infer<typeof updateFeatureRequestStatusSchema>;
export type CreateFeatureCommentDto = z.infer<typeof createFeatureCommentSchema>;

