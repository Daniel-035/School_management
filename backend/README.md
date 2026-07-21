# EduConnect Backend API

Node.js + Express + TypeScript backend for the school management system.

## Getting started

```bash
cp .env.example .env
npm install
npm run dev
```

`backend/.env.example` is the canonical backend environment-variable contract.
See [`../ENVIRONMENT.md`](../ENVIRONMENT.md) for descriptions and secret-handling
rules.

## Authentication

Authentication is handled entirely by **Firebase Authentication**. The backend
verifies Firebase ID tokens via the Admin SDK and delegates sign-in / refresh
to the Firebase Auth REST API (`identitytoolkit` / `securetoken`).

Users cannot create or set their own passwords. When an administrator creates
a staff or parent account via the admin panel, the backend:

1. Generates a random 16-character password
2. Creates a Firebase Auth user via the Admin SDK
3. Emails the credentials to the user's registered email (when SMTP is
   configured; otherwise returns them to the admin for manual delivery)

The demo seed provisions real Firebase Auth users. The bootstrap admin password
is set via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`; all other seeded users
receive generated passwords logged to the console at startup.

## API Endpoints

See `BACKEND_SUMMARY.md` for the full contract.

## Scripts

- `npm run dev` — start development server with hot reload
- `npm run build` — compile TypeScript
- `npm start` — run compiled production server
- `npm run typecheck` — run TypeScript checks
- `npm run test:emulator` — start the Firestore emulator and run Jest/Supertest integration tests
- `npm run seed` — seed demo data into the configured Firestore project

Swagger UI is available at `http://localhost:8080/docs`; the OpenAPI document is
available at `http://localhost:8080/openapi.json`.

