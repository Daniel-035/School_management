import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export function requireHttps(req: Request, res: Response, next: NextFunction) {
  if (!env.REQUIRE_HTTPS) return next();
  const proto = req.header("x-forwarded-proto") ?? req.protocol;
  if (proto === "https") return next();
  res.status(403).json({
    success: false,
    error: { code: "HTTPS_REQUIRED", message: "HTTPS is required" },
  });
}
