import { createHash } from "crypto";
import { db } from "../config/firebase";
import { AttendanceRecord, LeaveRequest } from "../types";
import { resolveSeedId } from "../seed-context";
import { create, findAll, findById, fromDocument, seedCollection, toDocument, update } from "./firestore.repository";

const RECORDS = "attendanceRecords";
const LEAVES = "leaveRequests";
const recordId = (studentId: string, date: string) => createHash("sha256").update(`${studentId}:${date}`).digest("hex");

class AttendanceRepository {
  async seed() {
    const today = new Date();
    const statuses: AttendanceRecord["status"][] = ["present", "present", "present", "late", "absent"];
    const students = [["stu-1", "cs-5a"], ["stu-2", "cs-7b"], ["stu-3", "cs-6b"]];
    const markedBy = resolveSeedId("u-teacher-1");
    const records: AttendanceRecord[] = [];
    for (let i = 0; i < students.length; i++) {
      for (let day = 0; day < 30; day++) {
        const current = new Date(today);
        current.setDate(current.getDate() - day);
        if (current.getDay() === 0) continue;
        const date = current.toISOString().slice(0, 10);
        const now = new Date();
        records.push({ id: recordId(students[i][0], date), studentId: students[i][0], classSectionId: students[i][1], date, status: statuses[(day + i) % statuses.length], markedBy, createdAt: now, updatedAt: now });
      }
    }
    await seedCollection<AttendanceRecord>(RECORDS, records);
    const now = new Date();
    const p1 = resolveSeedId("u-parent-1");
    await seedCollection<LeaveRequest>(LEAVES, [
      { id: "lv-1", studentId: "stu-1", parentId: p1, fromDate: new Date(now.getTime() - 14 * 86400000).toISOString().slice(0, 10), toDate: new Date(now.getTime() - 13 * 86400000).toISOString().slice(0, 10), reason: "Family wedding", status: "approved", createdAt: new Date(now.getTime() - 16 * 86400000), updatedAt: now },
      { id: "lv-2", studentId: "stu-2", parentId: p1, fromDate: new Date(now.getTime() + 5 * 86400000).toISOString().slice(0, 10), toDate: new Date(now.getTime() + 6 * 86400000).toISOString().slice(0, 10), reason: "Dental appointment", status: "pending", createdAt: new Date(now.getTime() - 86400000), updatedAt: now },
    ]);
  }

  findAllRecords(filter?: { studentId?: string; classSectionId?: string; date?: string }) {
    const filters = [];
    if (filter?.studentId) filters.push({ field: "studentId", value: filter.studentId });
    if (filter?.classSectionId) filters.push({ field: "classSectionId", value: filter.classSectionId });
    if (filter?.date) filters.push({ field: "date", value: filter.date });
    return findAll<AttendanceRecord>(RECORDS, filters);
  }

  findRecordById(id: string) { return findById<AttendanceRecord>(RECORDS, id); }

  async createRecord(data: Omit<AttendanceRecord, "id" | "createdAt" | "updatedAt">): Promise<AttendanceRecord> {
    const id = recordId(data.studentId, data.date);
    const ref = db.collection(RECORDS).doc(id);
    return db.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      const now = new Date();
      const record: AttendanceRecord = snapshot.exists
        ? { ...fromDocument<AttendanceRecord>(snapshot), ...data, id, updatedAt: now }
        : { ...data, id, createdAt: now, updatedAt: now };
      transaction.set(ref, toDocument(record));
      return record;
    });
  }

  findExistingRecord(studentId: string, date: string) { return this.findRecordById(recordId(studentId, date)); }

  findAllLeaveRequests(filter?: { studentId?: string; parentId?: string; status?: string }) {
    const filters = [];
    if (filter?.studentId) filters.push({ field: "studentId", value: filter.studentId });
    if (filter?.parentId) filters.push({ field: "parentId", value: filter.parentId });
    if (filter?.status) filters.push({ field: "status", value: filter.status });
    return findAll<LeaveRequest>(LEAVES, filters);
  }
  findLeaveRequestById(id: string) { return findById<LeaveRequest>(LEAVES, id); }
  createLeaveRequest(data: Omit<LeaveRequest, "id" | "createdAt" | "updatedAt">) { return create<LeaveRequest>(LEAVES, data); }
  updateLeaveRequest(id: string, data: Partial<LeaveRequest>) { return update<LeaveRequest>(LEAVES, id, data); }
}

export const attendanceRepository = new AttendanceRepository();
