import { FeePayment, FeeStructure } from "../types";
import { create, findAll, findById, seedCollection, update } from "./firestore.repository";

const STRUCTURES = "feeStructures";
const PAYMENTS = "feePayments";

class FeeRepository {
  async seed() {
    const today = new Date();
    const date = (days: number) => new Date(today.getTime() + days * 86400000).toISOString().slice(0, 10);
    await seedCollection<FeeStructure>(STRUCTURES, [
      { id: "fs-1", name: "Term 2 Tuition", classSectionId: "cs-5a", term: "Term 2 (2025-26)", dueDate: date(10), components: [{ name: "Tuition Fee", amount: 18000 }, { name: "Activity Fee", amount: 1500 }, { name: "Lab Fee", amount: 1200 }], createdAt: today, updatedAt: today },
      { id: "fs-2", name: "Term 2 Transport", classSectionId: "cs-5a", term: "Term 2 (2025-26)", dueDate: date(5), components: [{ name: "Bus - Route 4", amount: 4500 }], createdAt: today, updatedAt: today },
      { id: "fs-3", name: "Term 2 Tuition", classSectionId: "cs-7b", term: "Term 2 (2025-26)", dueDate: date(-2), components: [{ name: "Tuition Fee", amount: 21000 }, { name: "Activity Fee", amount: 1800 }, { name: "Lab Fee", amount: 1500 }], createdAt: today, updatedAt: today },
    ]);
    await seedCollection<FeePayment>(PAYMENTS, [
      { id: "fp-1", studentId: "stu-1", feeStructureId: "fs-1", amountDue: 20700, amountPaid: 0, status: "pending", createdAt: today, updatedAt: today },
      { id: "fp-2", studentId: "stu-1", feeStructureId: "fs-2", amountDue: 4500, amountPaid: 0, status: "pending", createdAt: today, updatedAt: today },
      { id: "fp-3", studentId: "stu-2", feeStructureId: "fs-3", amountDue: 24300, amountPaid: 12000, status: "pending", paidAt: date(-5), transactionId: "TXN-9821", paymentMethod: "UPI", createdAt: today, updatedAt: today },
    ]);
  }

  findAllStructures(filter?: { classSectionId?: string }) { return findAll<FeeStructure>(STRUCTURES, filter?.classSectionId ? [{ field: "classSectionId", value: filter.classSectionId }] : []); }
  findStructureById(id: string) { return findById<FeeStructure>(STRUCTURES, id); }
  createStructure(data: Omit<FeeStructure, "id" | "createdAt" | "updatedAt">) { return create<FeeStructure>(STRUCTURES, data); }
  findAllPayments(filter?: { studentId?: string }) { return findAll<FeePayment>(PAYMENTS, filter?.studentId ? [{ field: "studentId", value: filter.studentId }] : []); }
  findPaymentById(id: string) { return findById<FeePayment>(PAYMENTS, id); }
  createPayment(data: Omit<FeePayment, "id" | "createdAt" | "updatedAt">) { return create<FeePayment>(PAYMENTS, data); }
  updatePayment(id: string, data: Partial<FeePayment>) { return update<FeePayment>(PAYMENTS, id, data); }
}

export const feeRepository = new FeeRepository();
