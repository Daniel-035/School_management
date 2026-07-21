import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import * as announcementController from "../controllers/announcement.controller";
import { UserRole } from "../types";
import { validateBody, validateParams, validateQuery } from "../validators";
import * as schema from "../validators/schemas";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(schema.empty), announcementController.listAnnouncements);
router.post("/", requireRole(UserRole.Admin, UserRole.Staff), validateBody(schema.announcementCreate), announcementController.createAnnouncement);
router.post("/:id/send", requireRole(UserRole.Admin, UserRole.Staff), validateParams(schema.idParams), validateBody(schema.announcementSend), announcementController.sendAnnouncement);
router.get("/:id", validateParams(schema.idParams), announcementController.getAnnouncement);
router.put("/:id", requireRole(UserRole.Admin, UserRole.Staff), validateParams(schema.idParams), validateBody(schema.announcementUpdate), announcementController.updateAnnouncement);
router.delete("/:id", requireRole(UserRole.Admin, UserRole.Staff), validateParams(schema.idParams), announcementController.deleteAnnouncement);

export default router;
