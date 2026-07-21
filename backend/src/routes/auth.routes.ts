import { Router } from "express";
import { login, register, forgotPassword, resetPassword, refresh, me, logout, logoutAll } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { validateBody, validateQuery } from "../validators";
import * as schema from "../validators/schemas";

const router = Router();

router.post("/login", validateBody(schema.login), login);
router.post("/register", validateBody(schema.register), register);
router.post("/forgot-password", validateBody(schema.forgotPassword), forgotPassword);
router.post("/reset-password", validateBody(schema.resetPassword), resetPassword);
router.post("/refresh", validateBody(schema.refresh), refresh);
router.get("/me", authenticate, validateQuery(schema.empty), me);
router.post("/logout", validateBody(schema.refresh), logout);
router.post("/logout-all", authenticate, validateBody(schema.empty), logoutAll);

export default router;
