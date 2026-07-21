import { Request, Response } from "express";
import { z } from "zod";
import * as communicationService from "../services/communication.service";
import { asyncHandler } from "../utils/asyncHandler";
import { success, created } from "../utils/response";
import { AppError } from "../utils/errors";

const threadSchema = z.object({
  parentId: z.string().min(1),
  teacherId: z.string().min(1),
  teacherName: z.string().min(1),
  teacherSubject: z.string().min(1),
  studentId: z.string().min(1),
});

const messageSchema = z.object({
  text: z.string().min(1),
});

export const listThreads = asyncHandler(async (req: Request, res: Response) => {
  const filter: { parentId?: string; teacherId?: string } = {};
  if (req.query.parentId) filter.parentId = String(req.query.parentId);
  if (req.query.teacherId) filter.teacherId = String(req.query.teacherId);
  const threads = await communicationService.listThreads(filter);
  success(res, { threads });
});

export const createThread = asyncHandler(async (req: Request, res: Response) => {
  const parsed = threadSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid thread payload", 400, "VALIDATION_ERROR");
  const thread = await communicationService.createThread(parsed.data);
  created(res, { thread });
});

export const listMessages = asyncHandler(async (req: Request, res: Response) => {
  const messages = await communicationService.listMessages(req.params.id);
  success(res, { messages });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid message payload", 400, "VALIDATION_ERROR");
  const message = await communicationService.sendMessage({
    threadId: req.params.id,
    senderId: req.user!.userId,
    text: parsed.data.text,
  });
  created(res, { message });
});
