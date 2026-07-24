import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../types";
import * as feeController from "../controllers/fee.controller";
import { validateBody, validateParams, validateQuery } from "../validators";
import * as schema from "../validators/schemas";

const router = Router();

router.use(authenticate);

router.get("/structures", validateQuery(schema.structureQuery), feeController.listFeeStructures);
router.post("/structures", requireRole(UserRole.Admin), validateBody(schema.structureCreate), feeController.createFeeStructure);
router.get("/structures/:id", requireRole(UserRole.Admin), validateParams(schema.idParams), feeController.getFeeStructure);

router.get("/payments", validateQuery(schema.paymentQuery), feeController.listFeePayments);
router.get("/payments/:id", validateParams(schema.idParams), feeController.getFeePayment);
router.post("/payments", requireRole(UserRole.Admin), validateBody(schema.paymentCreate), feeController.createFeePayment);
router.post("/payments/:id/pay", requireRole(UserRole.Parent), validateParams(schema.idParams), validateBody(schema.paymentRecord), feeController.recordPayment);
router.get("/payments/:id/receipt", validateParams(schema.idParams), feeController.receipt);
router.post("/payments/:id/remind", requireRole(UserRole.Admin), validateParams(schema.idParams), feeController.sendReminder);

router.post("/payments/orders", validateBody(schema.orderCreate), feeController.createOrder);
router.post("/payments/verify", validateBody(schema.paymentVerify), feeController.verifyPayment);

router.get("/summary", requireRole(UserRole.Admin, UserRole.Staff), validateQuery(schema.empty), feeController.feeSummary);

export default router;
