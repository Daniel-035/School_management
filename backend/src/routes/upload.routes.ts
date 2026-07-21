import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth";
import { createUpload } from "../controllers/upload.controller";
import { validateBody } from "../validators";
import { uploadBody } from "../validators/schemas";
import { AppError } from "../utils/errors";

const router = Router();
const files = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, /^(image\/(jpeg|png|webp)|application\/pdf)$/.test(file.mimetype)) });
router.post("/", authenticate, files.single("file"), validateBody(uploadBody), (req, _res, next) => req.file ? next() : next(new AppError("File is required", 400, "VALIDATION_ERROR")), createUpload);
export default router;
