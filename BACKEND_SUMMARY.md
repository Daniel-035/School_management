# Backend Summary (Planned)

## Target Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Firestore (GCP) - planned migration path to Cloud SQL (PostgreSQL/MySQL) for scale
- **Authentication**: Firebase Auth (JWT tokens)
- **Deployment**: Google Cloud Run (stateless containers)

## API Endpoints (per the PRD)

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/logout` | Invalidate session |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/auth/refresh` | Refresh access token |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users` | List all users (admin) |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Deactivate user |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users/import` | Bulk upload CSV/Excel (admin) |

### Students
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/students` | List students with filters |
| POST | `/api/students` | Create student |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Remove student (admin) |
| GET | `/api/students/:id` | Get student details |

### Classes & Subjects
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/classes` | List all classes/sections |
| POST | `/api/classes` | Create class |
| PUT | `/api/classes/:id` | Update class |
| DELETE | `/api/classes/:id` | Delete class |
| POST | `/api/classes/:id/teachers` | Assign class teacher |
| GET | `/api/subjects` | List subjects |
| POST | `/api/subjects` | Create subject |

### Attendance
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/attendance` | Mark attendance (staff) |
| GET | `/api/attendance/student/:id` | Get student attendance |
| GET | `/api/attendance/class/:id` | Get class attendance (teacher) |
| GET | `/api/attendance/report` | Monthly summary |

### Homework
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/homework` | Create assignment (staff) |
| GET | `/api/homework/class/:id` | List for class |
| GET | `/api/homework/student/:id` | List for student |
| PUT | `/api/homework/:id` | Update assignment |

### Exams & Grades
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/grades` | Enter marks (staff) |
| GET | `/api/grades/student/:id` | Get student grades |
| GET | `/api/grades/class/:id` | Get class performance |
| POST | `/api/grades/report-card` | Generate report card |

### Fees
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/fees` | List fee records |
| POST | `/api/fees` | Create fee structure |
| PUT | `/api/fees/:id/pay` | Record payment |
| GET | `/api/fees/summary` | Financial summary (admin) |
| GET | `/api/fees/student/:id` | Student payment history |

### Announcements
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/announcements` | Create announcement |
| GET | `/api/announcements` | List announcements |
| POST | `/api/announcements/:id/send` | Send via push/SMS/email channels |

### Calendar
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/events` | List events |
| POST | `/api/events` | Create event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Remove event |

## Firestore Collections (Initial Schema)
```
users/{uid}
  - name, email, role, status, createdAt

students/{sid}
  - name, classSectionId, parentId, rollNumber, status

classSections/{csid}
  - name, grade, section, classTeacherId, subjectIds

subjects/{subid}
  - name, code

fees/{fid}
  - studentId, classSectionId, amount, amountPaid, dueDate, status

attendance/{aid}
  - studentId, classSectionId, date, status (present/absent)

homework/{hwId}
  - title, description, subjectId, classSectionId, dueDate, attachments

grades/{gid}
  - studentId, subjectId, assessment, marks, maxMarks

announcements/{annId}
  - title, message, audience, channels, createdAt, authorId

events/{eventId}
  - title, type, date, description
```

## Environment Variables (planned)
```
PORT=8080
FIRESTORE_PROJECT_ID=educonnect-prod
FIREBASE_SERVICE_ACCOUNT=...
JWT_SECRET=...
CORS_ORIGIN=https://admin-panel.web.app
```

## Deployment (GCP)
```bash
# Build & push
gcloud builds submit --tag gcr.io/$PROJECT_ID/school-api

# Deploy
gcloud run deploy school-api \
  --image gcr.io/$PROJECT_ID/school-api \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated
```

## Monitoring & Reliability
- Cloud Monitoring uptime checks (target: 99.9%)
- Cloud Logging for request/error tracking
- Slack alert webhook for downtime

## Out of Scope (Phase 1)
- Travel/Transport module
- Library module
- Real-time WebSockets (use push notifications instead)