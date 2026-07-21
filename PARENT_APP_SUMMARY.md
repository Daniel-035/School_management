# Parent & Guardian App — Build Summary

Flutter (Dart) mobile app for parents and legal guardians. Mirrors the
`staff_app` feature-first clean architecture, sits on top of the same
backend contract defined in `BACKEND_SUMMARY.md`.

## Modules delivered (per PRD)

| PRD Module              | Routes / Screens                                            | Key behaviour |
|-------------------------|-------------------------------------------------------------|---------------|
| Dashboard               | `/home?tab=0` → `DashboardPage`                             | Multi-child switcher, today's attendance, attendance % and outstanding fees tiles, pinned notices carousel, upcoming events list. |
| Attendance Tracker      | `/home?tab=1` → `AttendancePage` + `LeaveRequestSheet`      | 30-day summary (present/absent/late), custom month calendar, leave history, apply-for-leave bottom sheet with validation. |
| Academic Tracker        | `/home?tab=2` → `AcademicsPage` (tabs: Homework / Report Cards / Exams) | Overdue & upcoming homework with subject pills, report cards with subject-wise bars + teacher remark + Download/Share, exam schedule with countdown. |
| Fee Portal              | `/home?tab=3` → `FeesPage` + `PaymentSheet` + `ReceiptPage` | Outstanding summary with progress, fee structures, mock payment sheet (UPI/Card/Netbanking/Wallet), dedicated receipt page with copy/share. |
| Communication           | `/home?tab=4` → `CommunicationPage` + `AnnouncementDetailPage` + `ChatThreadPage` | Notices (pinned first), message threads with unread badges, chat with school-hours enforcement (Mon–Sat 8 AM–5 PM) and outside-hours banner. |
| School Calendar         | (opened from dashboard) → `CalendarPage`                    | Month grid with event dots, day selection, event detail rows. |
| Profile & Auth          | `/login` → `LoginPage`; Profile accessed from dashboard     | Email/password mock auth, multi-child switcher, settings tiles, sign-out. |

## Architecture

```
lib/
  core/                theme, router, providers, constants, formatters, date utils
  data/
    models/            AppUser, Student, ClassSection, Subject,
                       AttendanceRecord, LeaveRequest, Homework,
                       ExamSchedule, ReportCard, FeeStructure,
                       FeePayment, Announcement, MessageThread,
                       ChatMessage, SchoolEvent
    mock/              MockSeed, MockDb (in-memory mutable store)
    repositories/      auth, student, attendance, academics,
                       fees, communication, calendar
  features/
    auth/              login_page
    shell/             home_shell (5-tab bottom nav + IndexedStack)
    dashboard/         dashboard_page
    attendance/        attendance_page, leave_request_sheet
    academics/         academics_page (3 tabs)
    fees/              fees_page, payment_sheet, receipt_page
    communication/     communication_page, announcement_detail_page, chat_thread_page
    calendar/          calendar_page
    profile/           profile_page
  shared/widgets/      info_card, child_avatar, status_pill, section_header, empty_state
  app.dart             MaterialApp.router
  main.dart            ProviderScope
```

State: **Riverpod** (`flutter_riverpod ^2.5.1`).
Routing: **go_router** (`^14.2.7`) with auth-aware redirect.
Mock layer: `MockDb` singleton + repositories — swap to the real REST API by
replacing the repository implementations; providers and UI are unchanged.

## Conventions

- All copy is child-friendly/parent-friendly, sentence case, no jargon.
- Material 3 with seed color `#1E5BB8` (set in `AppConstants.seedColor`).
- Status colors centralised in `AppConstants` (positive/warning/danger).
- No business logic in widgets — all data access goes through repositories
  and Riverpod providers.
- `analysis_options.yaml` enables `strict-casts`, `strict-inference`,
  `prefer_const_*`, `use_key_in_widget_constructors`, `sort_child_properties_last`.

## Running

```bash
flutter pub get
flutter run
```

## Tests

```bash
flutter test
```

Covers:

- `AttendanceRepository` — summary aggregation, leave persistence, validation.
- `FeeRepository` — pay flow updates outstanding + issues receipt.
- `CommunicationRepository` — pinned-first ordering, message append.
- `Formatters` — currency, percent, date range.

## Authentication

Firebase Authentication is the sole login method. The demo seed provisions
real Firebase Auth users; generated passwords are logged to the backend console
at startup. The seed account `parent@school.local` is wired to **two** children
(siblings demo). A second parent account `rohan@school.local` is also seeded.

## Next steps to reach production

1. **Real API** — implement REST clients per `BACKEND_SUMMARY.md` and bind
   them to the existing repository interfaces; UI requires no changes.
3. **Push notifications** — add `firebase_messaging` and pipe into the
   announcements provider / a notification tray.
4. **Payment gateway** — swap `FeeRepository.pay` for a Razorpay/PayU/PhonePe
   SDK call; receipt becomes a server-issued PDF.
5. **Offline cache** — add `drift` (SQLite) for attendance/homework caching.
6. **i18n** — add `flutter_localizations` + `intl_translation` for Hindi
   (the school is bilingual per seed content).
7. **Accessibility** — audit contrast, add `Semantics` labels, large-text
   support.
