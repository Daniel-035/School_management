import { Request, Response } from "express";
import { z } from "zod";
import * as attendanceService from "../services/attendance.service";
import { asyncHandler } from "../utils/asyncHandler";
import { success, created } from "../utils/response";
import { AppError } from "../utils/errors";

const attendanceSchema = z.object({
  studentId: z.string().min(1),
  classSectionId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["present", "absent", "late"]),
});

const leaveSchema = z.object({
  studentId: z.string().min(1),
  parentId: z.string().min(1),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(1),
});

const leaveUpdateSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewedBy: z.string().min(1),
});

export const markAttendance = asyncHandler(async (req: Request, res: Response) => {
  const parsed = attendanceSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid attendance payload", 400, "VALIDATION_ERROR");
  const record = await attendanceService.markAttendance({ ...parsed.data, markedBy: req.user!.userId });
  created(res, { record });
});

export const markAllAttendance = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    classSectionId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(["present", "absent", "late"]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid payload", 400, "VALIDATION_ERROR");
  const result = await attendanceService.markAllAttendance(parsed.data.classSectionId, parsed.data.date, parsed.data.status, req.user!.userId);
  success(res, result);
});

export const getStudentAttendance = asyncHandler(async (req: Request, res: Response) => {
  const records = await attendanceService.getStudentAttendance(req.params.id);
  success(res, { records });
});

export const getClassAttendance = asyncHandler(async (req: Request, res: Response) => {
  const date = req.query.date ? String(req.query.date) : undefined;
  const records = await attendanceService.getClassAttendance(req.params.id, date);
  success(res, { records });
});

export const monthlySummary = asyncHandler(async (req: Request, res: Response) => {
  const month = req.query.month ? String(req.query.month) : new Date().toISOString().slice(0, 7);
  const summary = await attendanceService.monthlySummary(req.params.id, month);
  success(res, { summary });
});

export const applyLeave = asyncHandler(async (req: Request, res: Response) => {
  const parsed = leaveSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid leave payload", 400, "VALIDATION_ERROR");
  const request = await attendanceService.applyLeave(parsed.data);
  created(res, { request });
});

export const listLeaveRequests = asyncHandler(async (req: Request, res: Response) => {
  const filter: { studentId?: string; parentId?: string; status?: string } = {};
  if (req.query.studentId) filter.studentId = String(req.query.studentId);
  if (req.query.parentId) filter.parentId = String(req.query.parentId);
  if (req.query.status) filter.status = String(req.query.status);
  const requests = await attendanceService.listLeaveRequests(filter);
  success(res, { requests });
});

export const updateLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  const parsed = leaveUpdateSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid payload", 400, "VALIDATION_ERROR");
  const request = await attendanceService.updateLeaveRequest(req.params.id, parsed.data);
  success(res, { request });
});
