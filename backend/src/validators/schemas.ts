import { z } from "zod";
import { UserRole } from "../types";

export const empty = z.object({}).strict();
export const idParams = z.object({ id: z.string().min(1) }).strict();
export const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const optionalIdQuery = z.object({}).catchall(z.string().optional());
export const login = z.object({
  email: z.string().trim().min(1).optional(),
  identifier: z.string().trim().min(1).optional(),
  password: z.string().min(1),
}).refine(data => !!(data.email || data.identifier), {
  message: "Either email or identifier is required",
});
export const refresh = z.object({ refreshToken: z.string().min(1) }).strict();
export const register = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email().transform(value => value.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
}).strict();
export const forgotPassword = z.object({ email: z.string().trim().email().transform(value => value.toLowerCase()) }).strict();
export const resetPassword = z.object({
  oobCode: z.string().min(1, "Reset code is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
}).strict();
export const uploadBody = z.object({ purpose: z.enum(["homework-attachment", "profile-photo"]) }).strict();
export const userQuery = z.object({ role: z.nativeEnum(UserRole).optional(), status: z.enum(["active", "inactive"]).optional() }).strict();
export const userCreate = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email().transform(value => value.toLowerCase()),
  role: z.nativeEnum(UserRole),
  status: z.enum(["active", "inactive"]).default("active"),
  phone: z.string().trim().optional(),
  governmentId: z.string().trim().optional(),
  address: z.string().trim().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  profilePicturePath: z.string().optional(),
  department: z.string().trim().optional(),
  subjectIds: z.array(z.string()).default([]),
  isClassTeacher: z.boolean().default(false),
  classTeacherForId: z.string().optional(),
}).strict();
export const userUpdate = userCreate.partial().strict();
export const studentQuery = z.object({ classSectionId: z.string().optional(), parentId: z.string().optional() }).strict();
export const studentCreate = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  rollNumber: z.string().optional(),
  classSectionId: z.string().min(1, "Class is required"),
  parentIds: z.array(z.string()).default([]),
  governmentId: z.string().trim().optional(),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  fatherName: z.string().trim().optional(),
  fatherPhone: z.string().trim().optional(),
  motherName: z.string().trim().optional(),
  motherPhone: z.string().trim().optional(),
  profilePicturePath: z.string().optional(),
}).strict();
export const studentUpdate = studentCreate.extend({ status: z.enum(["active", "inactive"]).optional() }).partial().strict();
export const classCreate = z.object({ grade: z.string().min(1), section: z.string().min(1), name: z.string().min(1), classTeacherId: z.string().optional(), subjectIds: z.array(z.string()).default([]) }).strict();
export const classUpdate = classCreate.partial().strict();
export const subjectCreate = z.object({ name: z.string().min(1), code: z.string().min(1) }).strict();
export const attendanceCreate = z.object({ studentId: z.string().min(1), classSectionId: z.string().min(1), date, status: z.enum(["present", "absent", "late"]) }).strict();
export const attendanceBulk = z.object({ classSectionId: z.string().min(1), date, status: z.enum(["present", "absent", "late"]) }).strict();
export const dateQuery = z.object({ date: date.optional() }).strict();
export const monthQuery = z.object({ month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional() }).strict();
export const leaveCreate = z.object({ studentId: z.string().min(1), parentId: z.string().min(1), fromDate: date, toDate: date, reason: z.string().min(1) }).strict();
export const leaveQuery = z.object({ studentId: z.string().optional(), parentId: z.string().optional(), status: z.enum(["pending", "approved", "rejected"]).optional() }).strict();
export const leaveUpdate = z.object({ status: z.enum(["approved", "rejected"]), reviewedBy: z.string().optional() }).strict();
export const homeworkQuery = z.object({ classSectionId: z.string().optional(), studentId: z.string().optional() }).strict();
export const homeworkCreate = z.object({ title: z.string().min(1), description: z.string().min(1), subjectId: z.string().min(1), classSectionId: z.string().min(1), dueDate: date, attachments: z.array(z.string()).default([]) }).strict();
export const homeworkUpdate = homeworkCreate.partial().strict();
export const examQuery = z.object({ classSectionId: z.string().optional() }).strict();
export const examCreate = z.object({ subjectId: z.string().min(1), classSectionId: z.string().min(1), title: z.string().min(1), date, maxMarks: z.number().positive() }).strict();
export const examUpdate = examCreate.partial().strict();
export const gradeQuery = z.object({ studentId: z.string().optional(), examScheduleId: z.string().optional() }).strict();
export const gradeCreate = z.object({ studentId: z.string().min(1), examScheduleId: z.string().min(1), subjectId: z.string().min(1), marks: z.number().nonnegative(), remarks: z.string().optional() }).strict();
export const structureQuery = z.object({ classSectionId: z.string().optional() }).strict();
export const structureCreate = z.object({ name: z.string().min(1), classSectionId: z.string().min(1), term: z.string().min(1), dueDate: date, components: z.array(z.object({ name: z.string().min(1), amount: z.number().nonnegative() }).strict()).min(1) }).strict();
export const paymentQuery = z.object({ studentId: z.string().optional() }).strict();
export const paymentCreate = z.object({ studentId: z.string().min(1), feeStructureId: z.string().min(1), amountDue: z.number().nonnegative(), amountPaid: z.number().nonnegative().optional(), status: z.enum(["pending", "paid", "overdue"]).optional() }).strict();
export const paymentUpdate = paymentCreate.partial().strict();
export const paymentRecord = z.object({ amountPaid: z.number().positive(), paymentMethod: z.string().min(1), transactionId: z.string().optional(), paidAt: date.optional() }).strict();
export const announcementCreate = z.object({ title: z.string().min(1), body: z.string().min(1), channels: z.array(z.string()).default(["push"]), audience: z.array(z.string()).default(["all"]), pinned: z.boolean().default(false) }).strict();
export const announcementUpdate = announcementCreate.partial().strict();
export const announcementSend = z.object({ channels: z.array(z.enum(["push", "email", "sms"])).optional(), audience: z.array(z.string()).optional() }).strict();
export const threadQuery = z.object({ parentId: z.string().optional(), teacherId: z.string().optional() }).strict();
export const threadCreate = z.object({ parentId: z.string().min(1), teacherId: z.string().min(1), teacherName: z.string().min(1), teacherSubject: z.string().min(1), studentId: z.string().min(1) }).strict();
export const messageCreate = z.object({ text: z.string().min(1) }).strict();
export const eventCreate = z.object({ title: z.string().min(1), description: z.string().min(1), type: z.string().min(1), date }).strict();
export const eventUpdate = eventCreate.partial().strict();
export const orderCreate = z.object({ studentId: z.string().min(1), feeStructureId: z.string().min(1), amount: z.number().positive(), gateway: z.enum(["razorpay", "payu", "phonepe"]).default("razorpay") }).strict();
export const paymentVerify = z.object({ paymentId: z.string().min(1), orderId: z.string().min(1), signature: z.string().min(1), gateway: z.enum(["razorpay", "payu", "phonepe"]).default("razorpay") }).strict();
export const deviceRegister = z.object({ token: z.string().min(1), platform: z.enum(["ios", "android", "web"]) }).strict();
