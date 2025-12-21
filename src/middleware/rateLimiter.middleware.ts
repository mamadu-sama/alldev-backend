import rateLimit from "express-rate-limit";
import { env } from "@/config/env";

const windowMs = parseInt(env.RATE_LIMIT_WINDOW_MS, 10);
const maxRequests = parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10);

// Global rate limiter - very permissive for authenticated users
export const globalRateLimiter = rateLimit({
  windowMs: windowMs || 15 * 60 * 1000, // 15 minutes
  max: maxRequests || 5000, // 5000 requests per 15 min (appropriate for SPAs)
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Demasiados pedidos. Tente novamente mais tarde.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use different keys for authenticated vs unauthenticated users
  // This allows separate rate limit buckets for each user
  keyGenerator: (req) => {
    const user = (req as any).user;
    // Authenticated users get their own bucket (more permissive)
    // Unauthenticated users share IP-based buckets (more restrictive)
    return user ? `user:${user.id}` : `ip:${req.ip}`;
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Demasiadas tentativas de login. Tente novamente em 15 minutos.",
    },
  },
});

export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Demasiados pedidos. Tente novamente mais tarde.",
    },
  },
});

export const contactRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Maximum 3 contact messages per hour per IP
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Muitas tentativas de contato. Tente novamente em 1 hora.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Notification polling rate limiter - very permissive for polling
export const notificationRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute (very permissive for polling)
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Demasiados pedidos de notificações. Aguarde um momento.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Key by user ID if authenticated, otherwise by IP
  keyGenerator: (req) => {
    return (req as any).user?.id || req.ip;
  },
  // Skip for authenticated users during development
  skip: (req) => {
    // In development, be very permissive
    return process.env.NODE_ENV !== "production" && !!(req as any).user;
  },
});
