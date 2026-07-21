# EduConnect Admin Panel

React-based admin dashboard for the School Management System.

## Stack
- React 18 + TypeScript
- Vite
- React Router v6
- Tailwind CSS + shadcn/ui-style components
- Lucide React icons

## Getting Started

```bash
cd admin_panel
cp .env.example .env.local
npm install
npm run dev
```

The app starts at http://localhost:5173.

`admin_panel/.env.example` is the canonical admin environment-variable contract.
See [`../ENVIRONMENT.md`](../ENVIRONMENT.md) for descriptions and the distinction
between public `VITE_*` values and server secrets.

## Authentication

Sign in with your Firebase Authentication credentials. The bootstrap admin
email and password are set via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in
`backend/.env` during the demo seed. All other users receive generated
credentials emailed to their registered address.

When adding a new staff or parent, the admin panel automatically creates a
Firebase Auth account with a generated password and sends the credentials to
the user's email. If SMTP is not configured, the generated credentials are
shown in a dialog for manual delivery.

## Scripts
- `npm run dev` - Start dev server
- `npm run build` - Type-check and build for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

## Folder Structure
- `src/app/` - App root and router
- `src/components/layout/` - App shell (sidebar, topbar, protected route)
- `src/components/ui/` - Reusable UI primitives
- `src/features/` - Feature modules (auth, dashboard, users, academics, fees, calendar, announcements, settings)
- `src/services/` - Mock service layer (replace with real API)
- `src/data/` - Mock seed data
- `src/types/` - Shared TypeScript types
- `src/lib/` - Utility functions
