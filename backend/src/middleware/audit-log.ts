import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

const auditableMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function auditLog(req: Request, res: Response, next: NextFunction) {
  if (!auditableMethods.has(req.method)) return next();
  const started = Date.now();
  res.on("finish", () => {
    logger.info({
      event: "audit",
      actor: req.user?.userId ?? "anonymous",
      role: req.user?.role ?? "anonymous",
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      requestId: (req as Request & { id?: string }).id,
      durationMs: Date.now() - started,
    }, "audit event");
  });
  next();
}
