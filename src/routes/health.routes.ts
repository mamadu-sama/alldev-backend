import { Router, Request, Response } from "express";
import { prisma } from "@/config/database";

const router = Router();

/**
 * Health Check Endpoint
 * GET /api/health
 */
router.get("/health", async (_req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - startTime;

    // Get uptime
    const uptime = process.uptime();

    // Memory usage
    const memoryUsage = process.memoryUsage();

    res.status(200).json({
      success: true,
      message: "API is healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      environment: process.env.NODE_ENV,
      version: "1.0.0",
      checks: {
        database: {
          status: "healthy",
          responseTime: `${dbResponseTime}ms`,
        },
        memory: {
          status: "healthy",
          used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        },
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);

    res.status(503).json({
      success: false,
      message: "API is unhealthy",
      timestamp: new Date().toISOString(),
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

/**
 * Readiness Check (for Kubernetes/Docker)
 * GET /api/ready
 */
router.get("/ready", async (_req: Request, res: Response) => {
  try {
    // Check if database is accessible
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "API is ready",
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "API is not ready",
    });
  }
});

/**
 * Liveness Check (for Kubernetes/Docker)
 * GET /api/live
 */
router.get("/live", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "API is alive",
  });
});

export default router;
