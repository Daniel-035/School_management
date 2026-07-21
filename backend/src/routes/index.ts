import { Router } from "express";
import authRoutes from "./auth.routes";
import studentRoutes from "./student.routes";
import attendanceRoutes from "./attendance.routes";
import homeworkRoutes from "./homework.routes";
import examRoutes from "./exam.routes";
import feeRoutes from "./fee.routes";
import announcementRoutes from "./announcement.routes";
import communicationRoutes from "./communication.routes";
import calendarRoutes from "./calendar.routes";
import userRoutes from "./user.routes";
import uploadRoutes from "./upload.routes";
import devicesRoutes from "./devices.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/uploads", uploadRoutes);
router.use("/students", studentRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/homework", homeworkRoutes);
router.use("/exams", examRoutes);
router.use("/fees", feeRoutes);
router.use("/announcements", announcementRoutes);
router.use("/communication", communicationRoutes);
router.use("/events", calendarRoutes);
router.use("/devices", devicesRoutes);

export default router;
