import type { FeePayment, FeeStructure, FeeSummary } from "@/types";
import { api } from "./api";

export const feeService = {
  async getAll(): Promise<FeePayment[]> {
    const result = await api.get<{ payments: FeePayment[] }>("/fees/payments");
    return result.payments;
  },

  async getStructures(): Promise<FeeStructure[]> {
    const result = await api.get<{ structures: FeeStructure[] }>("/fees/structures");
    return result.structures;
  },

  async getSummary(): Promise<FeeSummary> {
    const result = await api.get<{ summary: FeeSummary }>("/fees/summary");
    return result.summary;
  },

  async createPayment(payload: Pick<FeePayment, "studentId" | "feeStructureId" | "amountDue">): Promise<FeePayment> {
    const result = await api.post<{ payment: FeePayment }>("/fees/payments", payload);
    return result.payment;
  },

  async updatePayment(id: string, payload: Partial<Pick<FeePayment, "studentId" | "feeStructureId" | "amountDue">>): Promise<FeePayment> {
    const result = await api.put<{ payment: FeePayment }>(`/fees/payments/${id}`, payload);
    return result.payment;
  },

  async recordPayment(id: string, payload: { amountPaid: number; paymentMethod: string; transactionId?: string; paidAt?: string }): Promise<FeePayment> {
    const result = await api.post<{ payment: FeePayment }>(`/fees/payments/${id}/pay`, payload);
    return result.payment;
  },
};
