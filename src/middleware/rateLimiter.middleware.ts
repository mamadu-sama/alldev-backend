import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';

const windowMs = parseInt(env.RATE_LIMIT_WINDOW_MS, 10);
const maxRequests = parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10);

export const globalRateLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiados pedidos. Tente novamente mais tarde.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas tentativas de login. Tente novamente em 15 minutos.',
    },
  },
});

export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiados pedidos. Tente novamente mais tarde.',
    },
  },
});

