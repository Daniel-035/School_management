import type { User, UserRole, Student, CreatedUserResult } from "@/types";
import { api } from "./api";

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status?: "active" | "inactive";
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  profilePicturePath?: string;
  department?: string;
  subjectIds?: string[];
  isClassTeacher?: boolean;
  classTeacherForId?: string;
}

export interface UpdateUserPayload extends Partial<CreateUserPayload> {
  status?: "active" | "inactive";
}

export interface CreateStudentPayload {
  firstName: string;
  lastName: string;
  rollNumber?: string;
  classSectionId: string;
  parentIds: string[];
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  profilePicturePath?: string;
}

export const userService = {
  async getAll(): Promise<User[]> {
    const result = await api.get<{ users: User[] }>("/users");
    return result.users;
  },

  async getByRole(role: UserRole): Promise<User[]> {
    const result = await api.get<{ users: User[] }>(`/users?role=${role}`);
    return result.users;
  },

  async getUser(id: string): Promise<User> {
    const result = await api.get<{ user: User }>(`/users/${id}`);
    return result.user;
  },

  async createUser(payload: CreateUserPayload): Promise<CreatedUserResult> {
    return api.post<CreatedUserResult>("/users", payload);
  },

  async updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    const result = await api.put<{ user: User }>(`/users/${id}`, payload);
    return result.user;
  },

  async getStudents(): Promise<Student[]> {
    const result = await api.get<{ students: Student[] }>("/students");
    return result.students;
  },

  async createStudent(payload: CreateStudentPayload): Promise<Student> {
    const result = await api.post<{ student: Student }>("/students", payload);
    return result.student;
  },

  async updateStudent(id: string, payload: Partial<CreateStudentPayload & { status: Student["status"] }>): Promise<Student> {
    const result = await api.put<{ student: Student }>(`/students/${id}`, payload);
    return result.student;
  },

  async deleteStudent(id: string): Promise<void> {
    await api.delete(`/students/${id}`);
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async importCsv(file: File): Promise<{ imported: number; failed: number; errors: { row: number; message: string }[] }> {
    const formData = new FormData();
    formData.append("file", file);
    return api.postForm("/users/import", formData);
  },

  async uploadProfilePhoto(file: File): Promise<{ objectPath: string; signedUrl: string; expiresAt: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", "profile-photo");
    return api.postForm("/uploads", formData);
  },

  async resetPassword(email: string): Promise<{ link: string }> {
    return api.post("/auth/reset-password", { email });
  },
};
