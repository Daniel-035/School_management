import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../config/logger";
import { Sentry } from "../observability/sentry";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";
  const message = err.isOperational ? err.message : "Internal server error";

  if (statusCode >= 500) {
    logger.error({ err, requestId: (req as Request & { id?: string }).id }, "Request failed");
    Sentry.captureException(err);
  }

  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}

