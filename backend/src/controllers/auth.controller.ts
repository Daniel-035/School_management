import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { success } from "../utils/response";
import { AppError } from "../utils/errors";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, identifier, password } = req.body as { email?: string; identifier?: string; password: string };
  const loginId = identifier || email || "";
  const result = await authService.login(loginId, password);
  success(res, result, 200, "Login successful");
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body as { firstName: string; lastName: string; email: string; password: string };
  const result = await authService.register({ firstName, lastName, email, password });
  success(res, result, 201, "Account created successfully");
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  await authService.forgotPassword(email);
  success(res, { message: "If an account exists for this email, a password reset link has been sent" }, 200, "Reset email sent");
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { oobCode, newPassword } = req.body as { oobCode: string; newPassword: string };
  await authService.resetPassword(oobCode, newPassword);
  success(res, { message: "Password has been reset successfully" }, 200, "Password reset");
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string };
  const result = await authService.refresh(refreshToken);
  success(res, result, 200, "Token refreshed");
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  const user = await authService.me(req.user.userId);
  success(res, { user });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  await authService.logout(refreshToken ?? "");
  success(res, { message: "Logged out successfully" });
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  await authService.logoutAll(req.user.userId);
  success(res, { message: "Logged out from all devices" });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  await authService.changeUserPassword(req.user.userId, currentPassword ?? "", newPassword ?? "");
  success(res, { message: "Password updated successfully" }, 200, "Password updated");
});
