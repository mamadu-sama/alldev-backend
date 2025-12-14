import { z } from 'zod';

export const updateSettingsSchema = z.object({
  // General
  siteName: z.string().min(1, 'Nome do site é obrigatório').max(100).optional(),
  siteDescription: z.string().min(1).max(500).optional(),
  siteUrl: z.string().url('URL inválida').optional(),
  contactEmail: z.string().email('Email inválido').optional(),
  
  // Moderation
  enableRegistration: z.boolean().optional(),
  requireEmailVerification: z.boolean().optional(),
  moderationMode: z.enum(['none', 'post', 'pre'], {
    errorMap: () => ({ message: 'Modo de moderação inválido' }),
  }).optional(),
  minReputationToPost: z.number().int().min(0).max(10000).optional(),
  minReputationToComment: z.number().int().min(0).max(10000).optional(),
  maxTagsPerPost: z.number().int().min(1).max(20).optional(),
  
  // Notifications
  enableNotifications: z.boolean().optional(),
  enableEmailNotifications: z.boolean().optional(),
  
  // Appearance
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida').optional(),
  darkModeDefault: z.boolean().optional(),
});

