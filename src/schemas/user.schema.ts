import { z } from "zod";

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username deve ter pelo menos 3 caracteres")
    .max(30, "Username deve ter no máximo 30 caracteres")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username deve conter apenas letras, números, _ e -"
    )
    .optional(),
  bio: z.string().max(500, "Bio deve ter no máximo 500 caracteres").optional(),
  skills: z.array(z.string()).max(10, "Máximo de 10 skills").optional(),
  socialLinks: z
    .object({
      github: z
        .string()
        .url("GitHub URL inválido")
        .optional()
        .or(z.literal("")),
      linkedin: z
        .string()
        .url("LinkedIn URL inválido")
        .optional()
        .or(z.literal("")),
      twitter: z
        .string()
        .url("Twitter URL inválido")
        .optional()
        .or(z.literal("")),
      website: z
        .string()
        .url("Website URL inválido")
        .optional()
        .or(z.literal("")),
    })
    .optional(),
});

export const updateNotificationPreferencesSchema = z.object({
  notificationSound: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
});

export const getUserPostsQuerySchema = z.object({
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().max(50).optional().default(20),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(8, "Nova senha deve ter pelo menos 8 caracteres")
      .regex(/[A-Z]/, "Nova senha deve conter pelo menos uma letra maiúscula")
      .regex(/[a-z]/, "Nova senha deve conter pelo menos uma letra minúscula")
      .regex(/[0-9]/, "Nova senha deve conter pelo menos um número"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const deleteAccountSchema = z
  .object({
    password: z
      .string()
      .min(1, "Senha é obrigatória para confirmar")
      .optional(),
    token: z.string().min(1).optional(),
    confirmation: z.literal("DELETE", {
      errorMap: () => ({ message: 'Digite "DELETE" para confirmar' }),
    }),
  })
  .refine((data) => !!data.password || !!data.token, {
    message: "Informe a senha ou o código enviado por email",
    path: ["password"],
  });
