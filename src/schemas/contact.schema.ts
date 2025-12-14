import { z } from "zod";

export const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Nome contém caracteres inválidos")
    .trim(),

  email: z
    .string()
    .email("Email inválido")
    .max(255, "Email muito longo")
    .toLowerCase()
    .trim(),

  reason: z.enum(
    ["general", "bug", "suggestion", "security", "partnership", "press"],
    {
      errorMap: () => ({ message: "Motivo de contato inválido" }),
    }
  ),

  subject: z
    .string()
    .min(5, "Assunto deve ter no mínimo 5 caracteres")
    .max(200, "Assunto deve ter no máximo 200 caracteres")
    .trim(),

  message: z
    .string()
    .min(20, "Mensagem deve ter no mínimo 20 caracteres")
    .max(5000, "Mensagem deve ter no máximo 5000 caracteres")
    .trim(),

  // Honeypot field - should be empty (bot detection)
  website: z
    .string()
    .optional()
    .refine((val) => !val || val === "", {
      message: "Campo inválido detectado",
    }),
});

export type ContactData = z.infer<typeof contactSchema>;
