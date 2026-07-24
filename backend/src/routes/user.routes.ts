import { Router } from "express";
import multer from "multer";
import * as controller from "../controllers/user.controller";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../types";
import { validateBody, validateParams, validateQuery } from "../validators";
import * as schema from "../validators/schemas";
import { AppError } from "../utils/errors";

const router = Router();
const csv = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, file.mimetype === "text/csv" || file.originalname.toLowerCase().endsWith(".csv")) });
router.use(authenticate, requireRole(UserRole.Admin, UserRole.Staff));
router.get("/", validateQuery(schema.userQuery), controller.list);
router.post("/import", csv.single("file"), (req, _res, next) => req.file ? next() : next(new AppError("CSV file is required", 400, "VALIDATION_ERROR")), controller.importCsv);
router.post("/", validateBody(schema.userCreate), controller.create);
router.get("/:id", validateParams(schema.idParams), controller.get);
router.put("/:id", validateParams(schema.idParams), validateBody(schema.userUpdate), controller.update);
router.delete("/:id", validateParams(schema.idParams), controller.remove);
export default router;
