# Admin Panel Frontend Summary

## Project Structure
```
admin_panel/
├── src/
│   ├── app/
│   │   ├── App.tsx              # Router provider + auth context wrapper
│   │   └── router.tsx           # React Router v6 routes with protected routes
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx      # Main sidebar + topbar shell
│   │   │   ├── Sidebar.tsx        # Navigation links
│   │   │   ├── Topbar.tsx         # User profile + logout
│   │   │   └── ProtectedRoute.tsx  # Route guard
│   │   └── ui/
│   │       ├── badge.tsx          # Status badges
│   │       ├── button.tsx         # Primary button component
│   │       ├── card.tsx           # Card layout
│   │       ├── dialog.tsx         # Modal dialogs
│   │       ├── input.tsx          # Form inputs
│   │       ├── label.tsx          # Form labels
│   │       ├── select.tsx         # Dropdown selects
│   │       ├── table.tsx          # Data tables
│   │       └── tabs.tsx           # Tabbed navigation
│   ├── features/
│   │   ├── auth/
│   │   │   ├── AuthContext.tsx    # React context for auth state
│   │   │   └── LoginPage.tsx      # Mock login
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx  # Summary cards + announcements + events
│   │   ├── users/
│   │   │   └── UsersPage.tsx      # Students/Staff/Parents tabs with CRUD
│   │   ├── academics/
│   │   │   └── AcademicsPage.tsx  # Classes + subjects pages with CRUD
│   │   ├── fees/
│   │   │   └── FeesPage.tsx       # Fee summary + records with CRUD
│   │   ├── calendar/
│   │   │   └── CalendarPage.tsx   # Events + timetable views
│   │   ├── announcements/
│   │   │   └── AnnouncementsPage.tsx # Create/list announcements
│   │   └── settings/
│   │       └── SettingsPage.tsx   # RBAC placeholder
│   ├── services/
│   │   ├── authService.ts         # Login/logout + session management
│   │   ├── userService.ts         # User/student CRUD (mock)
│   │   ├── academicService.ts     # Classes/subjects/timetable (mock)
│   │   ├── feeService.ts          # Fee records + summary (mock)
│   │   └── announcementService.ts # Announcements + calendar events (mock)
│   ├── data/mockData.ts           # Seed data for mock services
│   ├── lib/utils.ts               # cn(), formatCurrency, formatDate
│   └── types/index.ts             # Shared TypeScript interfaces
├── package.json
├── vite.config.ts
├── tsconfig.json + tsconfig.app.json + tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
└── eslint.config.js
```

## Routes
| Path | Component | Permissions |
|------|-----------|-------------|
| `/login` | LoginPage | Public |
| `/` | DashboardPage | Admin only |
| `/users` | UsersPage | Admin only |
| `/academics` | AcademicsPage | Admin only |
| `/fees` | FeesPage | Admin only |
| `/calendar` | CalendarPage | Admin only |
| `/announcements` | AnnouncementsPage | Admin only |
| `/settings` | SettingsPage | Admin only |

## Authentication

Sign in with Firebase Authentication credentials. The bootstrap admin is
provisioned by the demo seed using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from
`backend/.env`. All other users receive generated credentials emailed to their
registered address when an administrator creates their account.

## UI Library
- shadcn/ui style components (Button, Card, Dialog, Input, Label, Select, Table, Tabs, Badge)
- Tailwind CSS with CSS variables for theming
- Lucide React icons

## Action Buttons (per page)
| Page | Add Button | Row Actions |
|------|-----------|-------------|
| Dashboard | - | - |
| Users | + Add Student | Edit/Delete (Students/Staff/Parents) |
| Academics | + Add Class | Edit/Delete (Classes), Edit (Subjects) |
| Fees | + Add Fee | Edit + Download (Records) |
| Calendar | + Add Event | Edit/Delete (Events), Edit (Timetable) |
| Announcements | + New Announcement | - (list only) |
| Settings | - | - |

## Next Steps
1. Replace mock services with real backend API calls
2. Implement proper form validation (zod + react-hook-form)
3. Add toast notifications (sonner)
4. Connect to Firebase for real auth
5. Deploy to Firebase Hosting