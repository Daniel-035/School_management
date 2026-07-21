import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../types";
import * as studentController from "../controllers/student.controller";
import { validateBody, validateParams, validateQuery } from "../validators";
import * as schema from "../validators/schemas";

const router = Router();

router.use(authenticate);

router.get("/classes", validateQuery(schema.empty), studentController.listClasses);
router.post("/classes", requireRole(UserRole.Admin), validateBody(schema.classCreate), studentController.createClass);
router.get("/classes/:id", validateParams(schema.idParams), studentController.getClass);
router.put("/classes/:id", requireRole(UserRole.Admin), validateParams(schema.idParams), validateBody(schema.classUpdate), studentController.updateClass);
router.delete("/classes/:id", requireRole(UserRole.Admin), validateParams(schema.idParams), studentController.deleteClass);

router.get("/subjects", validateQuery(schema.empty), studentController.listSubjects);
router.post("/subjects", requireRole(UserRole.Admin), validateBody(schema.subjectCreate), studentController.createSubject);

router.get("/", validateQuery(schema.studentQuery), studentController.listStudents);
router.post("/", requireRole(UserRole.Admin), validateBody(schema.studentCreate), studentController.createStudent);
router.get("/:id", validateParams(schema.idParams), studentController.getStudent);
router.put("/:id", requireRole(UserRole.Admin), validateParams(schema.idParams), validateBody(schema.studentUpdate), studentController.updateStudent);
router.delete("/:id", requireRole(UserRole.Admin), validateParams(schema.idParams), studentController.deleteStudent);

export default router;
