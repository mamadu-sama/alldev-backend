import { z } from "zod";

// Schema para enviar notificação como admin
export const sendAdminNotificationSchema = z.object({
  title: z
    .string()
    .min(3, "Título deve ter no mínimo 3 caracteres")
    .max(200, "Título deve ter no máximo 200 caracteres")
    .trim(),

  message: z
    .string()
    .min(10, "Mensagem deve ter no mínimo 10 caracteres")
    .max(1000, "Mensagem deve ter no máximo 1000 caracteres")
    .trim(),

  type: z.enum(["info", "warning", "success", "error"], {
    errorMap: () => ({ message: "Tipo de notificação inválido" }),
  }),

  targetAudience: z.enum(["all", "admins", "moderators", "users"], {
    errorMap: () => ({ message: "Público-alvo inválido" }),
  }),
});

export type SendAdminNotificationDto = z.infer<
  typeof sendAdminNotificationSchema
>;
