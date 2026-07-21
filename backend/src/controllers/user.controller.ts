import { Request, Response } from "express";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { success } from "../utils/response";
import * as users from "../services/user.service";
import { userCreate } from "../validators/schemas";

export const list = asyncHandler(async (req: Request, res: Response) => success(res, { users: await users.listUsers(req.query) }));
export const get = asyncHandler(async (req: Request, res: Response) => success(res, { user: await users.getUser(req.params.id) }));
export const create = asyncHandler(async (req: Request, res: Response) => success(res, await users.createUser(req.body), 201));
export const update = asyncHandler(async (req: Request, res: Response) => success(res, { user: await users.updateUser(req.params.id, req.body) }));
export const remove = asyncHandler(async (req: Request, res: Response) => { await users.deleteUser(req.params.id); success(res, { message: "User deactivated" }); });
export const importCsv = asyncHandler(async (req: Request, res: Response) => {
  const rows = parse(req.file!.buffer, { columns: true, skip_empty_lines: true, trim: true }) as unknown[];
  const result: { imported: number; failed: number; errors: { row: number; message: string }[] } = { imported: 0, failed: 0, errors: [] };
  for (let index = 0; index < rows.length; index++) {
    const parsed = userCreate.safeParse(rows[index]);
    try {
      if (!parsed.success) throw new Error(parsed.error.issues.map(issue => issue.message).join("; "));
      await users.createUser(parsed.data as Parameters<typeof users.createUser>[0]);
      result.imported++;
    } catch (error) {
      result.failed++;
      result.errors.push({ row: index + 2, message: error instanceof Error ? error.message : "Import failed" });
    }
  }
  success(res, result);
});
