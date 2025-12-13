import { z } from 'zod';

export const hidePostSchema = z.object({
  reason: z.string().min(10, 'Motivo deve ter no mínimo 10 caracteres'),
});

export const lockPostSchema = z.object({
  reason: z.string().min(10, 'Motivo deve ter no mínimo 10 caracteres'),
});

export const banUserSchema = z.object({
  reason: z.string().min(10, 'Motivo deve ter no mínimo 10 caracteres'),
  duration: z.number().int().positive().optional(), // Days
});

export const updateMaintenanceModeSchema = z.object({
  isActive: z.boolean(),
  message: z.string().optional(),
  allowedRoles: z.array(z.enum(['USER', 'MODERATOR', 'ADMIN'])).optional(),
});


