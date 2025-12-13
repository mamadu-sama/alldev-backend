import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username deve ter no mínimo 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e underscore'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Password deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Password deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Password deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Password deve conter pelo menos um número'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Password é obrigatória'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z
    .string()
    .min(8, 'Password deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Password deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Password deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Password deve conter pelo menos um número'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password atual é obrigatória'),
  newPassword: z
    .string()
    .min(8, 'Nova password deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Nova password deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Nova password deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Nova password deve conter pelo menos um número'),
});

