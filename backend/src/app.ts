import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { db } from "./config/firebase";
import { logger } from "./config/logger";
import { openapi } from "./config/openapi";
import { corsOrigins, env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { auditLog } from "./middleware/audit-log";
import { requestId } from "./middleware/request-context";
import { requireHttps } from "./middleware/require-https";
import routes from "./routes";

export function createApp(): Application {
  const app = express();
  app.use(requestId);
  app.use(pinoHttp({ logger, genReqId: req => (req as typeof req & { id?: string }).id }));
  app.use(requireHttps);
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: env.NODE_ENV === "production" ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  }));
  app.use(cors({
    origin: (origin, callback) => callback(
      null,
      !origin
        || corsOrigins.includes(origin)
        || /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin)
        || /^https:\/\/[a-z0-9-]+\.(?:web\.app|firebaseapp\.com)$/.test(origin),
    ),
    credentials: true,
  }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use("/api/auth", rateLimit({ windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS, limit: env.AUTH_RATE_LIMIT_MAX, standardHeaders: "draft-7", legacyHeaders: false }));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));
  app.get("/openapi.json", (_req, res) => res.json(openapi));
  const healthHandler = (_req: express.Request, res: express.Response) => res.json({ status: "ok", timestamp: new Date().toISOString() });
  app.get("/health", healthHandler);
  app.get("/api/health", healthHandler);
  app.get("/healthz", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/healthz", (_req, res) => res.json({ status: "ok" }));
  const readyHandler = async (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    try { await db.collection("_health").limit(1).get(); res.json({ status: "ready" }); } catch (error) { next(error); }
  };
  app.get("/readyz", readyHandler);
  app.get("/api/readyz", readyHandler);
  app.use(auditLog);
  app.use("/api", routes);
  app.use((_req, res) => res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found" } }));
  app.use(errorHandler);
  return app;
}
