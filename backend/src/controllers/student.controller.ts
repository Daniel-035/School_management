import { Request, Response } from "express";
import { z } from "zod";
import { Gender } from "../types";
import * as studentService from "../services/student.service";
import { asyncHandler } from "../utils/asyncHandler";
import { success, created } from "../utils/response";
import { AppError } from "../utils/errors";

const studentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  rollNumber: z.string().optional(),
  classSectionId: z.string().min(1),
  parentIds: z.array(z.string()).default([]),
  governmentId: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
  profilePicturePath: z.string().optional(),
});

const classSchema = z.object({
  grade: z.string().min(1),
  section: z.string().min(1),
  name: z.string().min(1),
  classTeacherId: z.string().optional(),
  subjectIds: z.array(z.string()).default([]),
});

const subjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
});

export const listStudents = asyncHandler(async (req: Request, res: Response) => {
  const filter: { classSectionId?: string; parentId?: string } = {};
  if (req.query.classSectionId) filter.classSectionId = String(req.query.classSectionId);
  if (req.query.parentId) filter.parentId = String(req.query.parentId);
  const students = await studentService.listStudents(filter);
  success(res, { students });
});

export const getStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.getStudent(req.params.id);
  success(res, { student });
});

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const parsed = studentSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid student payload", 400, "VALIDATION_ERROR");
  const result = await studentService.createStudent(parsed.data as Parameters<typeof studentService.createStudent>[0]);
  created(res, result);
});

export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.updateStudent(req.params.id, req.body);
  success(res, { student });
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  await studentService.deleteStudent(req.params.id);
  success(res, { message: "Student deleted" });
});

export const listClasses = asyncHandler(async (req: Request, res: Response) => {
  const classes = await studentService.listClasses();
  success(res, { classes });
});

export const getClass = asyncHandler(async (req: Request, res: Response) => {
  const cls = await studentService.getClass(req.params.id);
  success(res, { class: cls });
});

export const createClass = asyncHandler(async (req: Request, res: Response) => {
  const parsed = classSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid class payload", 400, "VALIDATION_ERROR");
  const cls = await studentService.createClass(parsed.data);
  created(res, { class: cls });
});

export const updateClass = asyncHandler(async (req: Request, res: Response) => {
  const cls = await studentService.updateClass(req.params.id, req.body);
  success(res, { class: cls });
});

export const deleteClass = asyncHandler(async (req: Request, res: Response) => {
  await studentService.deleteClass(req.params.id);
  success(res, { message: "Class deleted" });
});

export const listSubjects = asyncHandler(async (req: Request, res: Response) => {
  const subjects = await studentService.listSubjects();
  success(res, { subjects });
});

export const createSubject = asyncHandler(async (req: Request, res: Response) => {
  const parsed = subjectSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid subject payload", 400, "VALIDATION_ERROR");
  const subject = await studentService.createSubject(parsed.data);
  created(res, { subject });
});
