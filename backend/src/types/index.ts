export enum UserRole {
  Admin = "admin",
  Staff = "staff",
  Parent = "parent",
}

export type Gender = "male" | "female" | "other";

export interface UserProfile {
  firstName: string;
  lastName: string;
  username: string;
  phone?: string;
  governmentId?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender;
  profilePicturePath?: string;
  department?: string;
  subjectIds?: string[];
  isClassTeacher?: boolean;
  classTeacherForId?: string;
}

export interface User extends UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface Student {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  rollNumber?: string;
  classSectionId: string;
  parentIds?: string[];
  governmentId?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender;
  fatherName?: string;
  fatherPhone?: string;
  motherName?: string;
  motherPhone?: string;
  profilePicturePath?: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassSection {
  id: string;
  grade: string;
  section: string;
  name: string;
  classTeacherId?: string;
  subjectIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classSectionId: string;
  date: string; // ISO date
  status: "present" | "absent" | "late";
  markedBy: string; // user id
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  parentId: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

export interface Homework {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classSectionId: string;
  dueDate: string;
  attachments: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamSchedule {
  id: string;
  subjectId: string;
  classSectionId: string;
  title: string;
  date: string;
  maxMarks: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Grade {
  id: string;
  studentId: string;
  examScheduleId: string;
  subjectId: string;
  marks: number;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeStructure {
  id: string;
  name: string;
  classSectionId: string;
  term: string;
  dueDate: string;
  components: { name: string; amount: number }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FeePayment {
  id: string;
  studentId: string;
  feeStructureId: string;
  amountDue: number;
  amountPaid: number;
  paymentMethod?: string;
  paidAt?: string;
  transactionId?: string;
  status: "pending" | "paid" | "overdue";
  createdAt: Date;
  updatedAt: Date;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  channels: string[];
  audience: string[];
  pinned: boolean;
  publishedAt: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageThread {
  id: string;
  parentId: string;
  teacherId: string;
  teacherName: string;
  teacherSubject: string;
  studentId: string;
  unreadCount: number;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  sentAt: string;
  createdAt: Date;
}

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

