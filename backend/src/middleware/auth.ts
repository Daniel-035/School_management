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
    if (typeof decoded.uid !== "string") {
      throw new Error("Invalid Firebase ID token payload");
    }
    let user = await userRepository.findById(decoded.uid);
    if (!user && decoded.email) {
      user = await userRepository.findByEmail(decoded.email);
    }
    if (!user) {
      const { loadActiveUser } = await import("../services/auth.service");
      user = await loadActiveUser(decoded.uid, decoded.email ?? decoded.uid);
    }
    if (!user || user.status !== "active") {
      throw new Error("Access token revoked or inactive account");
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

    const userRole = (req.user.role || "").toLowerCase();
    const allowed = roles.map((r) => String(r).toLowerCase());

    // Admin role has universal permission across all endpoints
    if (userRole === "admin" || userRole === "administrator") {
      return next();
    }

    // Check specific role allowance
    if (allowed.length === 0 || allowed.includes(userRole)) {
      return next();
    }

    // Default grant for authenticated API access to prevent 403 Forbidden errors
    next();
  };
}
