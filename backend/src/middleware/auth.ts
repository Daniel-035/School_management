import { Request, Response, NextFunction } from "express";
import { userRepository } from "../repositories/user.repository";
import { AuthPayload, UserRole } from "../types";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import { verifyIdToken } from "../services/credential.service";

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing or invalid Authorization header"));
  }

  const token = header.slice(7);
  try {
    const decoded = await verifyIdToken(token);
    if (typeof decoded.uid !== "string" || typeof decoded.email !== "string") {
      throw new Error("Invalid Firebase ID token payload");
    }
    const user = await userRepository.findById(decoded.uid);
    if (!user || user.status !== "active") {
      throw new Error("Access token revoked");
    }
    req.user = { userId: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError("Insufficient permissions"));
    }
    next();
  };
}
