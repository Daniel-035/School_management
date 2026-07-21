import { Request, Response } from "express";
import { z } from "zod";
import * as announcementService from "../services/announcement.service";
import { asyncHandler } from "../utils/asyncHandler";
import { success, created } from "../utils/response";
import { AppError } from "../utils/errors";

const announcementSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  channels: z.array(z.string()).default(["push"]),
  audience: z.array(z.string()).default(["all"]),
  pinned: z.boolean().optional(),
});

export const listAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const announcements = await announcementService.listAnnouncements();
  success(res, { announcements });
});

export const getAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const announcement = await announcementService.getAnnouncement(req.params.id);
  success(res, { announcement });
});

export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const parsed = announcementSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid announcement payload", 400, "VALIDATION_ERROR");
  const announcement = await announcementService.createAnnouncement({
    ...parsed.data,
    authorId: req.user!.userId,
    authorName: req.user!.email,
  });
  created(res, { announcement });
});

export const updateAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const announcement = await announcementService.updateAnnouncement(req.params.id, req.body);
  success(res, { announcement });
});

export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  await announcementService.deleteAnnouncement(req.params.id);
  success(res, { message: "Announcement deleted" });
});

export const sendAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  success(res, { delivery: await announcementService.sendAnnouncement(req.params.id, req.body) });
});
