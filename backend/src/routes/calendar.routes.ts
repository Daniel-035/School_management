import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../types";
import * as calendarController from "../controllers/calendar.controller";
import { validateBody, validateParams, validateQuery } from "../validators";
import * as schema from "../validators/schemas";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(schema.empty), calendarController.listEvents);
router.get("/:id", validateParams(schema.idParams), calendarController.getEvent);
router.post("/", requireRole(UserRole.Admin), validateBody(schema.eventCreate), calendarController.createEvent);
router.put("/:id", requireRole(UserRole.Admin), validateParams(schema.idParams), validateBody(schema.eventUpdate), calendarController.updateEvent);
router.delete("/:id", requireRole(UserRole.Admin), validateParams(schema.idParams), calendarController.deleteEvent);

export default router;
