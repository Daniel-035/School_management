import { Request, Response } from "express";
import { z } from "zod";
import * as examService from "../services/exam.service";
import { asyncHandler } from "../utils/asyncHandler";
import { success, created } from "../utils/response";
import { AppError } from "../utils/errors";

const examSchema = z.object({
  subjectId: z.string().min(1),
  classSectionId: z.string().min(1),
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  maxMarks: z.number().positive(),
});

const gradeSchema = z.object({
  studentId: z.string().min(1),
  examScheduleId: z.string().min(1),
  subjectId: z.string().min(1),
  marks: z.number().nonnegative(),
  remarks: z.string().optional(),
});

export const listExams = asyncHandler(async (req: Request, res: Response) => {
  const filter: { classSectionId?: string } = {};
  if (req.query.classSectionId) filter.classSectionId = String(req.query.classSectionId);
  if (req.path.startsWith("/class/")) filter.classSectionId = req.params.id;
  const exams = await examService.listExams(filter);
  success(res, { exams });
});

export const getExam = asyncHandler(async (req: Request, res: Response) => {
  const exam = await examService.getExam(req.params.id);
  success(res, { exam });
});

export const createExam = asyncHandler(async (req: Request, res: Response) => {
  const parsed = examSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid exam payload", 400, "VALIDATION_ERROR");
  const exam = await examService.createExam(parsed.data);
  created(res, { exam });
});

export const updateExam = asyncHandler(async (req: Request, res: Response) => {
  const exam = await examService.updateExam(req.params.id, req.body);
  success(res, { exam });
});

export const deleteExam = asyncHandler(async (req: Request, res: Response) => {
  await examService.deleteExam(req.params.id);
  success(res, { message: "Exam deleted" });
});

export const listGrades = asyncHandler(async (req: Request, res: Response) => {
  const filter: { studentId?: string; examScheduleId?: string } = {};
  if (req.query.studentId) filter.studentId = String(req.query.studentId);
  if (req.query.examScheduleId) filter.examScheduleId = String(req.query.examScheduleId);
  const grades = await examService.listGrades(filter);
  success(res, { grades });
});

export const createGrade = asyncHandler(async (req: Request, res: Response) => {
  const parsed = gradeSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid grade payload", 400, "VALIDATION_ERROR");
  const grade = await examService.createGrade(parsed.data);
  created(res, { grade });
});

export const studentReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await examService.getStudentReport(req.params.id);
  success(res, { report });
});

export const classPerformance = asyncHandler(async (req: Request, res: Response) => {
  const performance = await examService.getClassPerformance(req.params.id);
  success(res, { performance });
});
