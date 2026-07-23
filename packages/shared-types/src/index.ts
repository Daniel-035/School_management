export type UserRole = "admin" | "staff" | "parent" | "student";

export type UserStatus = "active" | "inactive";

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  governmentId?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  profilePicturePath?: string;
  department?: string;
  subjectIds?: string[];
  isClassTeacher?: boolean;
  classTeacherForId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatedUserResult {
  user: User;
  username?: string;
  provisionalPassword?: string;
  emailSent: boolean;
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
  gender?: "male" | "female" | "other";
  fatherName?: string;
  fatherPhone?: string;
  motherName?: string;
  motherPhone?: string;
  profilePicturePath?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSection {
  id: string;
  name: string;
  grade: string;
  section: string;
  classTeacherId?: string;
  subjectIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export type FeeStatus = "pending" | "paid" | "overdue";

export interface FeeStructure {
  id: string;
  name: string;
  classSectionId: string;
  term: string;
  dueDate: string;
  components: { name: string; amount: number }[];
  createdAt: string;
  updatedAt: string;
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
  status: FeeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FeeSummary {
  totalDue: number;
  totalPaid: number;
  outstanding: number;
  count: number;
}

export type AnnouncementAudience = "all" | "staff" | "parents" | "class";

export type AnnouncementChannel = "push" | "sms" | "email";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  channels: AnnouncementChannel[];
  audience: AnnouncementAudience[];
  pinned: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type EventType = "holiday" | "exam" | "event" | "ptm";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableEntry {
  id: string;
  classSectionId: string;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
  period: number;
  subjectId: string;
  teacherId: string;
}

export interface AuthSession {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classSectionId: string;
  date: string;
  status: "present" | "absent" | "late";
  markedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  parentId: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface ExamSchedule {
  id: string;
  subjectId: string;
  classSectionId: string;
  title: string;
  date: string;
  maxMarks: number;
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  studentId: string;
  examScheduleId: string;
  subjectId: string;
  marks: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  sentAt: string;
  createdAt: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  date: string;
  createdAt: string;
  updatedAt: string;
}
