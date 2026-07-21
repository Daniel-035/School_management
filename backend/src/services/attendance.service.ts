import { attendanceRepository } from "../repositories/attendance.repository";
import { studentRepository } from "../repositories/student.repository";
import { NotFoundError } from "../utils/errors";

export async function markAttendance(data: { studentId: string; classSectionId: string; date: string; status: "present" | "absent" | "late"; markedBy: string }) {
  return attendanceRepository.createRecord(data);
}

export async function getStudentAttendance(studentId: string) {
  return attendanceRepository.findAllRecords({ studentId });
}

export async function getClassAttendance(classSectionId: string, date?: string) {
  return attendanceRepository.findAllRecords({ classSectionId, date });
}

export async function monthlySummary(studentId: string, month: string) {
  const [year, monthNum] = month.split("-").map(Number);
  const first = new Date(year, monthNum - 1, 1);
  const last = new Date(year, monthNum, 0);
  const records = await attendanceRepository.findAllRecords({ studentId });
  let present = 0, absent = 0, late = 0, total = 0;
  for (const r of records) {
    const d = new Date(r.date);
    if (d >= first && d <= last) {
      total++;
      if (r.status === "present") present++;
      if (r.status === "absent") absent++;
      if (r.status === "late") late++;
    }
  }
  return { present, absent, late, total, percentPresent: total > 0 ? Math.round((present / total) * 100) : 0 };
}

export async function applyLeave(data: { studentId: string; parentId: string; fromDate: string; toDate: string; reason: string }) {
  return attendanceRepository.createLeaveRequest({ ...data, status: "pending" });
}

export async function listLeaveRequests(filter?: { studentId?: string; parentId?: string; status?: string }) {
  return attendanceRepository.findAllLeaveRequests(filter);
}

export async function updateLeaveRequest(id: string, data: { status: "approved" | "rejected"; reviewedBy: string }) {
  const request = await attendanceRepository.findLeaveRequestById(id);
  if (!request) throw new NotFoundError("Leave request");
  return attendanceRepository.updateLeaveRequest(id, { status: data.status, updatedAt: new Date() });
}

export async function markAllAttendance(classSectionId: string, date: string, status: "present" | "absent" | "late", markedBy: string) {
  const students = await studentRepository.findAll({ classSectionId });
  for (const s of students) {
    await attendanceRepository.createRecord({ studentId: s.id, classSectionId, date, status, markedBy });
  }
  return { count: students.length };
}
