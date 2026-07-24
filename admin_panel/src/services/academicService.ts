import type { ClassSection, Subject } from "@/types";
import { api } from "./api";

export interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  classSectionId: string;
  subjectId: string;
  dueDate: string;
  assignedBy?: string;
  createdAt?: string;
}

export interface AttendanceRecordItem {
  id?: string;
  studentId: string;
  classSectionId: string;
  date: string;
  status: "present" | "absent" | "late";
}

export interface LeaveRequestItem {
  id: string;
  studentId: string;
  parentId: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: string;
}

export const academicService = {
  async getClasses(): Promise<ClassSection[]> {
    const result = await api.get<{ classes: ClassSection[] }>("/students/classes");
    return result.classes;
  },
  async createClass(payload: Omit<ClassSection, "id" | "createdAt" | "updatedAt">): Promise<ClassSection> {
    const result = await api.post<{ class: ClassSection }>("/students/classes", payload);
    return result.class;
  },
  async updateClass(id: string, payload: Partial<Omit<ClassSection, "id" | "createdAt" | "updatedAt">>): Promise<ClassSection> {
    const result = await api.put<{ class: ClassSection }>(`/students/classes/${id}`, payload);
    return result.class;
  },
  async deleteClass(id: string): Promise<void> {
    await api.delete(`/students/classes/${id}`);
  },
  async getSubjects(): Promise<Subject[]> {
    const result = await api.get<{ subjects: Subject[] }>("/students/subjects");
    return result.subjects;
  },
  async getHomework(classSectionId?: string): Promise<HomeworkItem[]> {
    const query = classSectionId ? `?classSectionId=${classSectionId}` : "";
    const result = await api.get<{ homework: HomeworkItem[] } | HomeworkItem[]>(`/homework${query}`);
    if (Array.isArray(result)) return result;
    return result.homework || [];
  },
  async getAttendance(classSectionId?: string, date?: string): Promise<AttendanceRecordItem[]> {
    const params = new URLSearchParams();
    if (classSectionId) params.append("classSectionId", classSectionId);
    if (date) params.append("date", date);
    const query = params.toString() ? `?${params.toString()}` : "";
    const result = await api.get<{ records: AttendanceRecordItem[] } | AttendanceRecordItem[]>(`/attendance${query}`);
    if (Array.isArray(result)) return result;
    return result.records || [];
  },
  async getLeaveRequests(): Promise<LeaveRequestItem[]> {
    const result = await api.get<{ requests: LeaveRequestItem[] } | LeaveRequestItem[]>("/attendance/leave");
    if (Array.isArray(result)) return result;
    return result.requests || [];
  },
  async updateLeaveStatus(id: string, status: "approved" | "rejected", reviewedBy: string): Promise<void> {
    await api.put(`/attendance/leave/${id}`, { status, reviewedBy });
  },
};
