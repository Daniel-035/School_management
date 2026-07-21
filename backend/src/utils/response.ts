import { Response } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code: string; message: string };
}

export function success<T>(res: Response, data: T, statusCode = 200, message?: string) {
  const payload: ApiResponse<T> = { success: true, data };
  if (message) payload.message = message;
  res.status(statusCode).json(payload);
}

export function created<T>(res: Response, data: T, message = "Created successfully") {
  success(res, data, 201, message);
}

export function noContent(res: Response) {
  res.status(204).send();
}

