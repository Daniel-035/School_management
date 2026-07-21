import { Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import * as feeService from "../services/fee.service";
import { env } from "../config/env";
import { asyncHandler } from "../utils/asyncHandler";
import { success, created } from "../utils/response";
import { AppError } from "../utils/errors";

const feeStructureSchema = z.object({
  name: z.string().min(1),
  classSectionId: z.string().min(1),
  term: z.string().min(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  components: z.array(z.object({ name: z.string().min(1), amount: z.number().nonnegative() })).min(1),
});

const paymentSchema = z.object({
  studentId: z.string().min(1),
  feeStructureId: z.string().min(1),
  amountDue: z.number().nonnegative(),
  amountPaid: z.number().nonnegative().optional(),
  status: z.enum(["pending", "paid", "overdue"]).optional(),
});

const recordPaymentSchema = z.object({
  amountPaid: z.number().positive(),
  paymentMethod: z.string().min(1),
  transactionId: z.string().optional(),
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const listFeeStructures = asyncHandler(async (req: Request, res: Response) => {
  const filter: { classSectionId?: string } = {};
  if (req.query.classSectionId) filter.classSectionId = String(req.query.classSectionId);
  const structures = await feeService.listFeeStructures(filter);
  success(res, { structures });
});

export const getFeeStructure = asyncHandler(async (req: Request, res: Response) => {
  const structure = await feeService.getFeeStructure(req.params.id);
  success(res, { structure });
});

export const createFeeStructure = asyncHandler(async (req: Request, res: Response) => {
  const parsed = feeStructureSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid fee structure payload", 400, "VALIDATION_ERROR");
  const structure = await feeService.createFeeStructure(parsed.data);
  created(res, { structure });
});

export const listFeePayments = asyncHandler(async (req: Request, res: Response) => {
  const filter: { studentId?: string } = {};
  if (req.query.studentId) filter.studentId = String(req.query.studentId);
  const payments = await feeService.listFeePayments(filter);
  success(res, { payments });
});

export const getFeePayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await feeService.getFeePayment(req.params.id);
  success(res, { payment });
});

export const createFeePayment = asyncHandler(async (req: Request, res: Response) => {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid payment payload", 400, "VALIDATION_ERROR");
  const payment = await feeService.createFeePayment(parsed.data);
  created(res, { payment });
});

export const updateFeePayment = asyncHandler(async (req: Request, res: Response) => {
  success(res, { payment: await feeService.updateFeePayment(req.params.id, req.body) });
});

export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  const parsed = recordPaymentSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid payment payload", 400, "VALIDATION_ERROR");
  const payment = await feeService.recordPayment(req.params.id, parsed.data);
  success(res, { payment });
});

export const feeSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await feeService.feeSummary();
  success(res, { summary });
});

const orderSchema = z.object({ studentId: z.string().min(1), feeStructureId: z.string().min(1), amount: z.number().positive(), gateway: z.enum(["razorpay", "payu", "phonepe"]).default("razorpay") });

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid order payload", 400, "VALIDATION_ERROR");
  const { amount, gateway } = parsed.data;
  const amountInPaise = Math.round(amount * 100);
  if (gateway !== "razorpay") {
    throw new AppError(`Gateway ${gateway} is not configured`, 501, "GATEWAY_UNAVAILABLE");
  }
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    // Local development: synthesize an order so the mobile app flow can
    // be exercised end-to-end without a live merchant key.
    success(res, {
      orderId: `order_dev_${Date.now()}`,
      amount: amountInPaise,
      currency: "INR",
      gateway,
      keyId: env.RAZORPAY_KEY_ID ?? "rzp_test_dummy",
      test: true,
    });
    return;
  }
  success(res, {
    orderId: `order_dev_${Date.now()}`,
    amount: amountInPaise,
    currency: "INR",
    gateway,
    keyId: env.RAZORPAY_KEY_ID,
  });
});

const verifySchema = z.object({ paymentId: z.string().min(1), orderId: z.string().min(1), signature: z.string().min(1), gateway: z.enum(["razorpay", "payu", "phonepe"]).default("razorpay") });

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid verification payload", 400, "VALIDATION_ERROR");
  const { paymentId, orderId, signature, gateway } = parsed.data;
  if (gateway === "razorpay" && env.RAZORPAY_KEY_SECRET) {
    const expected = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    if (expected !== signature) {
      throw new AppError("Invalid payment signature", 400, "INVALID_SIGNATURE");
    }
  }
  const payment = await feeService.recordPayment(paymentId, {
    amountPaid: req.body.amountPaid ?? 0,
    paymentMethod: req.body.method ?? "gateway",
    transactionId: paymentId,
  });
  success(res, payment);
});

export const receipt = asyncHandler(async (req: Request, res: Response) => {
  const payment = await feeService.getFeePayment(req.params.id);
  // Server-issued PDF is generated client-side; we hand back a JSON
  // receipt that the mobile app uses to render the canonical document.
  success(res, {
    receipt: {
      number: payment.transactionId ?? payment.id,
      issuedAt: payment.paidAt ?? new Date().toISOString().slice(0, 10),
      amountPaid: payment.amountPaid,
      method: payment.paymentMethod ?? "gateway",
      studentId: payment.studentId,
      feeStructureId: payment.feeStructureId,
    },
  });
});

export const sendReminder = asyncHandler(async (req: Request, res: Response) => {
  const result = await feeService.sendFeeReminderPush(req.params.id);
  success(res, result);
});
