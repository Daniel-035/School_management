import { Request, Response } from "express";
import { z } from "zod";
import * as homeworkService from "../services/homework.service";
import { asyncHandler } from "../utils/asyncHandler";
import { success, created } from "../utils/response";
import { AppError } from "../utils/errors";

const homeworkSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  subjectId: z.string().min(1),
  classSectionId: z.string().min(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  attachments: z.array(z.string()).optional(),
});

export const listHomework = asyncHandler(async (req: Request, res: Response) => {
  const filter: { classSectionId?: string; studentId?: string } = {};
  if (req.query.classSectionId) filter.classSectionId = String(req.query.classSectionId);
  if (req.query.studentId) filter.studentId = String(req.query.studentId);
  if (req.path.startsWith("/class/")) filter.classSectionId = req.params.id;
  if (req.path.startsWith("/student/")) filter.studentId = req.params.id;
  const homework = await homeworkService.listHomework(filter);
  success(res, { homework });
});

export const getHomework = asyncHandler(async (req: Request, res: Response) => {
  const item = await homeworkService.getHomework(req.params.id);
  success(res, { homework: item });
});

export const createHomework = asyncHandler(async (req: Request, res: Response) => {
  const parsed = homeworkSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid homework payload", 400, "VALIDATION_ERROR");
  const item = await homeworkService.createHomework({ ...parsed.data, createdBy: req.user!.userId });
  created(res, { homework: item });
});

export const updateHomework = asyncHandler(async (req: Request, res: Response) => {
  const item = await homeworkService.updateHomework(req.params.id, req.body);
  success(res, { homework: item });
});

export const deleteHomework = asyncHandler(async (req: Request, res: Response) => {
  await homeworkService.deleteHomework(req.params.id);
  success(res, { message: "Homework deleted" });
});
