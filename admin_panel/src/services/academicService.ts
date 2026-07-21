import type { ClassSection, Subject } from "@/types";
import { api } from "./api";

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
};
