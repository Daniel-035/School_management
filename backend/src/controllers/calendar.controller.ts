import { Request, Response } from "express";
import { z } from "zod";
import * as calendarService from "../services/calendar.service";
import { asyncHandler } from "../utils/asyncHandler";
import { success, created } from "../utils/response";
import { AppError } from "../utils/errors";

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const listEvents = asyncHandler(async (req: Request, res: Response) => {
  const events = await calendarService.listEvents();
  success(res, { events });
});

export const getEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await calendarService.getEvent(req.params.id);
  success(res, { event });
});

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid event payload", 400, "VALIDATION_ERROR");
  const event = await calendarService.createEvent(parsed.data);
  created(res, { event });
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await calendarService.updateEvent(req.params.id, req.body);
  success(res, { event });
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  await calendarService.deleteEvent(req.params.id);
  success(res, { message: "Event deleted" });
});
