import { feeRepository } from "../repositories/fee.repository";
import { studentRepository } from "../repositories/student.repository";
import { sendPushToTokens } from "./notification.service";
import { db } from "../config/firebase";
import { NotFoundError, AppError } from "../utils/errors";

export async function listFeeStructures(filter?: { classSectionId?: string }) {
  return feeRepository.findAllStructures(filter);
}

export async function getFeeStructure(id: string) {
  const structure = await feeRepository.findStructureById(id);
  if (!structure) throw new NotFoundError("Fee structure");
  return structure;
}

export async function createFeeStructure(data: { name: string; classSectionId: string; term: string; dueDate: string; components: { name: string; amount: number }[] }) {
  return feeRepository.createStructure(data);
}

export async function listFeePayments(filter?: { studentId?: string }) {
  return feeRepository.findAllPayments(filter);
}

export async function getFeePayment(id: string) {
  const payment = await feeRepository.findPaymentById(id);
  if (!payment) throw new NotFoundError("Fee payment");
  return payment;
}

export async function createFeePayment(data: { studentId: string; feeStructureId: string; amountDue: number; amountPaid?: number; status?: "pending" | "paid" | "overdue" }) {
  return feeRepository.createPayment({
    ...data,
    amountPaid: data.amountPaid || 0,
    status: data.status || "pending",
  });
}

export async function updateFeePayment(id: string, data: Partial<{ studentId: string; feeStructureId: string; amountDue: number; amountPaid: number; status: "pending" | "paid" | "overdue" }>) {
  const payment = await feeRepository.updatePayment(id, data);
  if (!payment) throw new NotFoundError("Fee payment");
  return payment;
}

export async function recordPayment(id: string, data: { amountPaid: number; paymentMethod: string; transactionId?: string; paidAt?: string }) {
  const payment = await feeRepository.findPaymentById(id);
  if (!payment) throw new NotFoundError("Fee payment");
  const updatedAmountPaid = payment.amountPaid + data.amountPaid;
  const status: "pending" | "paid" | "overdue" = updatedAmountPaid >= payment.amountDue ? "paid" : "pending";
  return feeRepository.updatePayment(id, {
    amountPaid: updatedAmountPaid,
    paymentMethod: data.paymentMethod,
    transactionId: data.transactionId,
    paidAt: data.paidAt || new Date().toISOString().slice(0, 10),
    status,
  });
}

export async function feeSummary() {
  const payments = await feeRepository.findAllPayments();
  const totalDue = payments.reduce((sum, p) => sum + p.amountDue, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  return { totalDue, totalPaid, outstanding: totalDue - totalPaid, count: payments.length };
}

export async function sendFeeReminderPush(paymentId: string) {
  const payment = await feeRepository.findPaymentById(paymentId);
  if (!payment) throw new NotFoundError("Fee payment");
  if (payment.status === "paid") {
    throw new AppError("Fee has already been paid", 400, "BAD_REQUEST");
  }
  const student = await studentRepository.findById(payment.studentId);
  if (!student) throw new NotFoundError("Student");
  
  if (student.parentIds && student.parentIds.length > 0) {
    const snapshot = await db.collection("devices").where("userId", "in", student.parentIds).get();
    const tokens = snapshot.docs.map(doc => doc.get("token") as string).filter(Boolean);
    if (tokens.length > 0) {
      await sendPushToTokens(tokens, {
        title: "Fee Payment Reminder",
        body: `A payment of INR ${payment.amountDue - payment.amountPaid} is pending for ${student.name}.`,
        data: { paymentId: payment.id },
      });
    }
  }
  return { success: true };
}
