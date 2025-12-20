import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import path from "path";
import passport from "./config/passport.config";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";
import { globalRateLimiter } from "./middleware/rateLimiter.middleware";
import { checkMaintenance } from "./middleware/maintenance.middleware";
import routes from "./routes";

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = env.FRONTEND_URL.split(",").map((url) => url.trim());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Initialize Passport
app.use(passport.initialize());

// Serve static files (uploaded sounds)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Logging
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Rate limiting (only for production or unauthenticated users)
if (env.NODE_ENV === "production") {
  app.use(globalRateLimiter);
}
// In development, skip global rate limiting to allow easier testing

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Maintenance mode check
app.use(checkMaintenance);

// API routes
app.use(env.API_PREFIX, routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Endpoint não encontrado",
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
