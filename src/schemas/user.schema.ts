import { z } from 'zod';

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username deve ter no mínimo 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e underscore')
    .optional(),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
  skills: z.array(z.string()).max(20, 'Máximo 20 skills').optional(),
  socialLinks: z
    .object({
      github: z.string().url('URL inválida').optional().or(z.literal('')),
      linkedin: z.string().url('URL inválida').optional().or(z.literal('')),
      twitter: z.string().url('URL inválida').optional().or(z.literal('')),
      portfolio: z.string().url('URL inválida').optional().or(z.literal('')),
    })
    .optional(),
});

export const getUserPostsQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
});

