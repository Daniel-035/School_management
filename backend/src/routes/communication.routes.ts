import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as communicationController from "../controllers/communication.controller";
import { validateBody, validateParams, validateQuery } from "../validators";
import * as schema from "../validators/schemas";

const router = Router();

router.use(authenticate);

router.get("/threads", validateQuery(schema.threadQuery), communicationController.listThreads);
router.post("/threads", validateBody(schema.threadCreate), communicationController.createThread);
router.get("/threads/:id/messages", validateParams(schema.idParams), communicationController.listMessages);
router.post("/threads/:id/messages", validateParams(schema.idParams), validateBody(schema.messageCreate), communicationController.sendMessage);

export default router;
