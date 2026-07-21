import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../types";
import * as examController from "../controllers/exam.controller";
import { validateBody, validateParams, validateQuery } from "../validators";
import * as schema from "../validators/schemas";

const router = Router();

router.use(authenticate);

router.get("/grades", validateQuery(schema.gradeQuery), examController.listGrades);
router.post("/grades", requireRole(UserRole.Staff), validateBody(schema.gradeCreate), examController.createGrade);
router.get("/report/:id", validateParams(schema.idParams), examController.studentReport);
router.get("/performance/:id", validateParams(schema.idParams), examController.classPerformance);

router.get("/", validateQuery(schema.examQuery), examController.listExams);
router.get("/class/:id", validateParams(schema.idParams), validateQuery(schema.empty), examController.listExams);
router.post("/", requireRole(UserRole.Staff), validateBody(schema.examCreate), examController.createExam);
router.get("/:id", validateParams(schema.idParams), examController.getExam);
router.put("/:id", requireRole(UserRole.Staff), validateParams(schema.idParams), validateBody(schema.examUpdate), examController.updateExam);
router.delete("/:id", requireRole(UserRole.Staff, UserRole.Admin), validateParams(schema.idParams), examController.deleteExam);

export default router;
