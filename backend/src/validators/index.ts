import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppError } from "../utils/errors";

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
      return next(new AppError(message, 400, "VALIDATION_ERROR"));
    }
    req.body = parsed.data;
    next();
  };
}

export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      const message = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
      return next(new AppError(message, 400, "VALIDATION_ERROR"));
    }
    req.query = parsed.data;
    next();
  };
}

export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      const message = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
      return next(new AppError(message, 400, "VALIDATION_ERROR"));
    }
    req.params = parsed.data;
    next();
  };
}

