# EduConnect API Contract

Base URL: `http://localhost:8080/api`

Auth: Bearer token in `Authorization` header. Obtain via `POST /auth/login`.

## Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "..."
}
```

Errors:
```json
{
  "success": false,
  "error": { "code": "...", "message": "..." }
}
```

## Authentication

- `POST /auth/login` `{ email, password }` → `{ token, accessToken, refreshToken, user }`
- `POST /auth/refresh` `{ refreshToken }` → `{ token, accessToken, refreshToken, user }`; each use rotates the refresh token
- `GET /auth/me` (auth) → `{ user }`
- `POST /auth/logout` `{ refreshToken }` → `{ message }`
- `POST /auth/logout-all` (auth) → `{ message }`; revokes every access and refresh token for the user

## Users

- `GET /users?role=...&status=...` (auth, admin) → `{ users }`
- `POST /users` (auth, admin) → `{ user }`
- `GET /users/:id` (auth) → `{ user }`
- `PUT /users/:id` (auth, admin) → `{ user }`
- `DELETE /users/:id` (auth, admin) → `{ message }`

## Students / Classes / Subjects

- `GET /students?classSectionId=...&parentId=...` (auth) → `{ students }`
- `POST /students` (auth, admin) → `{ student }`
- `GET /students/:id` (auth) → `{ student }`
- `PUT /students/:id` (auth, admin) → `{ student }`
- `DELETE /students/:id` (auth, admin) → `{ message }`
- `GET /students/classes` (auth) → `{ classes }`
- `POST /students/classes` (auth, admin) → `{ class }`
- `GET /students/classes/:id` (auth) → `{ class }`
- `PUT /students/classes/:id` (auth, admin) → `{ class }`
- `DELETE /students/classes/:id` (auth, admin) → `{ message }`
- `GET /students/subjects` (auth) → `{ subjects }`
- `POST /students/subjects` (auth, admin) → `{ subject }`

## Attendance

- `POST /attendance` (auth, staff) → `{ record }` body: `{ studentId, classSectionId, date, status }`
- `POST /attendance/bulk` (auth, staff) → `{ count }` body: `{ classSectionId, date, status }`
- `GET /attendance/student/:id` (auth) → `{ records }`
- `GET /attendance/class/:id?date=...` (auth) → `{ records }`
- `GET /attendance/summary/:id?month=YYYY-MM` (auth) → `{ summary }`
- `POST /attendance/leave` (auth, parent) → `{ request }` body: `{ studentId, parentId, fromDate, toDate, reason }`
- `GET /attendance/leave?studentId=...&parentId=...&status=...` (auth) → `{ requests }`
- `PUT /attendance/leave/:id` (auth, staff/admin) → `{ request }` body: `{ status, reviewedBy }`

## Homework

- `GET /homework?classSectionId=...&studentId=...` (auth) → `{ homework }`
- `GET /homework/:id` (auth) → `{ homework }`
- `POST /homework` (auth, staff) → `{ homework }` body: `{ title, description, subjectId, classSectionId, dueDate, attachments }`
- `PUT /homework/:id` (auth, staff) → `{ homework }`
- `DELETE /homework/:id` (auth, staff/admin) → `{ message }`

## Exams & Grades

- `GET /exams?classSectionId=...` (auth) → `{ exams }`
- `GET /exams/:id` (auth) → `{ exam }`
- `POST /exams` (auth, staff) → `{ exam }` body: `{ subjectId, classSectionId, title, date, maxMarks }`
- `PUT /exams/:id` (auth, staff) → `{ exam }`
- `DELETE /exams/:id` (auth, staff/admin) → `{ message }`
- `GET /exams/grades?studentId=...&examScheduleId=...` (auth) → `{ grades }`
- `POST /exams/grades` (auth, staff) → `{ grade }` body: `{ studentId, examScheduleId, subjectId, marks, remarks }`
- `GET /exams/report/:id` (auth) → `{ report }`
- `GET /exams/performance/:id` (auth) → `{ performance }`

## Fees

- `GET /fees/structures` (auth, admin) → `{ structures }`
- `GET /fees/structures/:id` (auth, admin) → `{ structure }`
- `POST /fees/structures` (auth, admin) → `{ structure }` body: `{ name, classSectionId, term, dueDate, components }`
- `GET /fees/payments?studentId=...` (auth) → `{ payments }`
- `GET /fees/payments/:id` (auth) → `{ payment }`
- `POST /fees/payments` (auth, admin) → `{ payment }` body: `{ studentId, feeStructureId, amountDue, amountPaid?, status? }`
- `POST /fees/payments/:id/pay` (auth, parent) → `{ payment }` body: `{ amountPaid, paymentMethod, transactionId?, paidAt? }`
- `GET /fees/summary` (auth, admin) → `{ summary }`

## Announcements

- `GET /announcements` (auth) → `{ announcements }`
- `GET /announcements/:id` (auth) → `{ announcement }`
- `POST /announcements` (auth, admin/staff) → `{ announcement }` body: `{ title, body, channels, audience, pinned }`
- `PUT /announcements/:id` (auth, admin/staff) → `{ announcement }`
- `DELETE /announcements/:id` (auth, admin/staff) → `{ message }`

## Communication

- `GET /communication/threads?parentId=...&teacherId=...` (auth) → `{ threads }`
- `POST /communication/threads` (auth) → `{ thread }` body: `{ parentId, teacherId, teacherName, teacherSubject, studentId }`
- `GET /communication/threads/:id/messages` (auth) → `{ messages }`
- `POST /communication/threads/:id/messages` (auth) → `{ message }` body: `{ text }`

## Calendar

- `GET /events` (auth) → `{ events }`
- `GET /events/:id` (auth) → `{ event }`
- `POST /events` (auth, admin) → `{ event }` body: `{ title, description, type, date }`
- `PUT /events/:id` (auth, admin) → `{ event }`
- `DELETE /events/:id` (auth, admin) → `{ message }`

## Common TypeScript Interfaces

```typescript
export enum UserRole {
  Admin = "admin",
  Staff = "staff",
  Parent = "parent",
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  name: string;
  rollNumber?: string;
  classSectionId: string;
  parentIds: string[];
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface ClassSection {
  id: string;
  grade: string;
  section: string;
  name: string;
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

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classSectionId: string;
  date: string; // ISO date
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
  status: "pending" | "paid" | "overdue";
  createdAt: string;
  updatedAt: string;
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
  type: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}
```

## Notes for Client Implementations

- Dates are strings in ISO 8601 or `YYYY-MM-DD` format.
- All endpoints return `success: true` and wrap data in a `data` object.
- Attachments and file uploads are mock URLs for now.
- Bearer token must be persisted after login and sent with every request.
- Authentication is handled by **Firebase Authentication**. The backend
  verifies Firebase ID tokens via the Admin SDK. Login and refresh delegate to
  the Firebase Auth REST API.
- Users cannot create or set their own passwords. Administrators create
  accounts via the admin panel; the backend generates a password, provisions a
  Firebase Auth user, and emails the credentials automatically.
