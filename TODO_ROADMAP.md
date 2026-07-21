# EduConnect — Remaining Work (Step-by-Step Roadmap)

This file consolidates everything still needed to take the project from its
current skeleton (backend scaffold + React admin panel + two Flutter apps, all
on mock/in-memory data) to a functional, user-friendly, production-ready
product. Work is ordered so each phase unblocks the next.

---

## Phase 0 — Prerequisites & conventions
1. Add a top-level `SETUP.md` (prereqs, env vars, how to run each app, how to seed).
2. Agree a single source of truth for env vars (`backend/.env.example`,
   `admin_panel/.env.example`, Firebase config files) and document each.
3. Create a shared `.gitignore` additions for secrets, build output, and
   `*.local` config.

## Phase 1 — Make the backend real (unblocks everything)
1. Wire Firestore: create `backend/src/config/firebase.ts` and initialize
   `firebase-admin` from `FIREBASE_SERVICE_ACCOUNT`.
2. Replace any in-memory stub data in repositories with Firestore reads/writes.
3. Validate env with zod in `src/config/env.ts` (fail fast on missing vars).
4. Implement password hashing (bcrypt) + role-based `requireRole` middleware.
5. Add refresh-token rotation + logout-all-devices + logout endpoint.
6. Add missing endpoints called by the apps/contract:
   - `POST /auth/reset-password`, `POST /auth/verify-email`
   - `POST /attendance/bulk`
   - `POST /users/import` (CSV)
   - `POST /uploads` (homework attachments, profile photos) + signed URLs
   - `POST /announcements/:id/send` (push/email/SMS dispatcher)
7. Apply Zod validation middleware to EVERY route (not just auth).
8. Add cross-cutting middleware: CORS allowlist, helmet, request-id + `pino`
   logging, rate limiting on `/auth/*`, OpenAPI/Swagger from the contract.
9. Add `/healthz` and `/readyz` probes.
10. Add `npm run seed` script populating a demo school (2 parents, classes,
    subjects, students, attendance, fee structures, announcements, events).
11. Write Jest + supertest tests per route (run against Firestore emulator).
12. Add `Dockerfile`, `.dockerignore`, `cloudbuild.yaml`, and a `gcloud run
    deploy` script.

## Phase 2 — Admin Panel: real data + core UX
1. Replace all `*Service.ts` mocks with real API calls (use react-query/swr for
   caching, retries, optimistic updates).
2. Real auth: persist token, attach to requests, refresh on 401, hydrate
   `AuthContext` from `GET /auth/me` on startup.
3. Add `react-hook-form` + `zod` validation to every Add/Edit dialog.
4. Add `sonner` toasts for all create/update/delete feedback.
5. Add loading (skeletons), empty, and error+retry states to every list page.
6. Tables: server-side pagination, sorting, search, filters, CSV export,
   bulk-select + bulk-delete.
7. Dashboard: real charts (attendance trend, fee collection, per-class
   counts, recent activity feed).
8. Users: CSV import, parent↔student linking UI, "reset password" action.
9. Academics: assign class teachers, subject↔class mapping, timetable builder.
10. Fees: record-payment dialog, auto-generated PDF receipt (jsPDF), per-student
    payment history, collection report export.
11. Announcements: audience builder (classes/channels), send-now + scheduled.
12. Settings: real RBAC (roles & permissions), school profile, theme toggle.
13. Add 404 / 403 pages, breadcrumbs, dark mode, printable views.

## Phase 3 — Staff App: complete teacher workflows
1. Confirm `ApiClient` + repositories hit the real backend with loading/error
   states exposed via Riverpod `AsyncValue`.
2. Mark attendance: class roster grid, bulk "all present", late/half-day,
   edit prior days, monthly report.
3. Enter marks: exam picker → student table → inline entry with max-marks
   validation → publish/unpublish.
4. Homework: create/edit/delete with title, description, due date, subject,
   class, and attachments (image/PDF picker).
5. Communication: message threads with parents, attachments, read receipts,
   broadcast to whole class.
6. Announcements: staff create announcements scoped to their class(es).
7. Timetable: read-only weekly grid, colored by subject, today highlighted.
8. Profile: assigned classes/subjects, change password, quick login.
9. Push: `firebase_messaging` for homework/messages/announcements in tray.
10. Offline: cache today's attendance locally and sync when back online.
11. UX: pull-to-refresh, skeletons, empty states, snackbars, retry.
12. i18n (en + hi), accessibility (Semantics, dynamic text).

## Phase 4 — Parent App: trust, polish, real integrations
1. Confirm real network layer: token load/refresh, 401 refresh, friendly errors.
2. Payments: replace mock `PaymentSheet` with Razorpay/PayU/PhonePe; server
   issues the receipt PDF.
3. Push notifications: `firebase_messaging` for announcements/messages/attendance/fees.
4. In-app notification tray: bell with unread badge + list page.
5. Calendar: "Add to device calendar" on events/exams.
6. PDF/Share: real report-card + receipt PDF (`pdf` + `printing`), `share_plus`.
7. Biometric login: `local_auth` after first sign-in.
8. Persist last-selected child across sessions.
9. UX: pull-to-refresh, skeletons, optimistic chat, unread badges, empty/retry.
10. Dark mode toggle (persisted) in profile.
11. i18n (en + hi); accessibility audit (Semantics, contrast, dynamic text).
12. Onboarding: first-launch carousel + Skip.
13. Store readiness: app icon, splash, `google-services.json`/plist, listing
    assets, privacy policy URL, support email.

## Phase 5 — Productionize (all apps)
1. Tests: unit (repositories/models), widget (critical pages), integration
   (login → dashboard → payment), coverage gate in CI.
2. CI/CD (GitHub Actions): lint + test + build; sign Android/iOS; deploy admin
   to Firebase Hosting, backend to Cloud Run, apps to Play/TestFlight.
3. Security: input sanitization, HTTPS-only, Flutter cert pinning, secure token
   storage, Firestore security rules, per-collection RBAC, audit log.
4. Observability: Crashlytics (Flutter) + Sentry (web/backend), analytics
   (Firebase Analytics/GA4), feature flags for staged rollout.
5. Update `README.md` to point to `SETUP.md` and this roadmap.
