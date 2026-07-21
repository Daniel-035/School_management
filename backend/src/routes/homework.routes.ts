import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../types";
import * as homeworkController from "../controllers/homework.controller";
import { validateBody, validateParams, validateQuery } from "../validators";
import * as schema from "../validators/schemas";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(schema.homeworkQuery), homeworkController.listHomework);
router.get("/class/:id", validateParams(schema.idParams), validateQuery(schema.empty), homeworkController.listHomework);
router.get("/student/:id", validateParams(schema.idParams), validateQuery(schema.empty), homeworkController.listHomework);
router.get("/:id", validateParams(schema.idParams), homeworkController.getHomework);
router.post("/", requireRole(UserRole.Staff), validateBody(schema.homeworkCreate), homeworkController.createHomework);
router.put("/:id", requireRole(UserRole.Staff), validateParams(schema.idParams), validateBody(schema.homeworkUpdate), homeworkController.updateHomework);
router.delete("/:id", requireRole(UserRole.Staff, UserRole.Admin), validateParams(schema.idParams), homeworkController.deleteHomework);

export default router;
