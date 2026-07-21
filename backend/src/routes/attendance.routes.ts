import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../types";
import * as attendanceController from "../controllers/attendance.controller";
import { validateBody, validateParams, validateQuery } from "../validators";
import * as schema from "../validators/schemas";

const router = Router();

router.use(authenticate);

router.post("/", requireRole(UserRole.Staff), validateBody(schema.attendanceCreate), attendanceController.markAttendance);
router.post("/bulk", requireRole(UserRole.Staff), validateBody(schema.attendanceBulk), attendanceController.markAllAttendance);
router.get("/student/:id", validateParams(schema.idParams), validateQuery(schema.empty), attendanceController.getStudentAttendance);
router.get("/class/:id", validateParams(schema.idParams), validateQuery(schema.dateQuery), attendanceController.getClassAttendance);
router.get("/summary/:id", validateParams(schema.idParams), validateQuery(schema.monthQuery), attendanceController.monthlySummary);
router.post("/leave", requireRole(UserRole.Parent), validateBody(schema.leaveCreate), attendanceController.applyLeave);
router.get("/leave", validateQuery(schema.leaveQuery), attendanceController.listLeaveRequests);
router.put("/leave/:id", requireRole(UserRole.Staff, UserRole.Admin), validateParams(schema.idParams), validateBody(schema.leaveUpdate), attendanceController.updateLeaveRequest);

export default router;
