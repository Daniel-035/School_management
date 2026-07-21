import { Request, Response } from "express";
import { upload } from "../services/upload.service";
import { asyncHandler } from "../utils/asyncHandler";
import { success } from "../utils/response";

export const createUpload = asyncHandler(async (req: Request, res: Response) => success(res, await upload(req.user!.userId, req.body.purpose, req.file!), 201));
