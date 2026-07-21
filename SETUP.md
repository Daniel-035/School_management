# Local Setup

This repository contains four independently managed components:

| Component | Directory | Stack | Default target |
| --- | --- | --- | --- |
| Backend API | `backend/` | Node.js, Express, TypeScript | `http://localhost:8080` |
| Admin panel | `admin_panel/` | React, TypeScript, Vite | `http://localhost:5173` |
| Parent app | `parent_app/` | Flutter | Selected Flutter device |
| Staff app | `staff_app/` | Flutter | Selected Flutter device |

Run the backend first, then start any clients you need. There is no top-level
install or run command.

## Prerequisites

- Git.
- Node.js 18 or newer and npm for the backend and admin panel. The repository
  does not pin an exact Node.js version.
- Flutter 3.38 or newer with Dart 3.10 or newer to use the committed Flutter
  lockfiles. Run `flutter doctor` to verify the installation.
- Tooling for the intended Flutter target:
  - Android: Android SDK, a compatible JDK, accepted Android licenses, and an
    emulator or physical device.
  - iOS/macOS: macOS and Xcode.
  - Windows: Visual Studio with **Desktop development with C++**.
  - Web: a Flutter-supported browser such as Chrome.

A Firebase project with Firestore, Authentication, Cloud Storage, and Cloud
Messaging enabled is required. The service account needs access to those
services. There is no separate database migration tool.

## Environment Variables

### Backend

Create the local backend environment file from the committed template:

```bash
cd backend
cp .env.example .env
```

On PowerShell, use `Copy-Item .env.example .env` instead of `cp` if needed.

| Variable | Required | Default/example | Purpose |
| --- | --- | --- | --- |
| `JWT_SECRET` | Yes | `replace-with-a-long-random-secret` | Signs and verifies access tokens. Replace the example with a long local secret. |
| `PORT` | No | `8080` | Express server port. |
| `NODE_ENV` | No | `development` | Runtime mode: `development`, `test`, or `production`. |
| `JWT_EXPIRES_IN` | No | `7d` | Deprecated. Kept for backward compatibility only; Firebase Authentication is now the sole login provider. |
| `FIREBASE_WEB_API_KEY` | Yes | — | Firebase Web API key (Project Settings → General → Web apps). Used by the backend to verify Firebase Auth sign-ins. |
| `FIREBASE_SERVICE_ACCOUNT` | Yes | Minified service-account JSON | Initializes Firebase Admin for Firestore, Auth, Storage, and Messaging. |
| `FIREBASE_STORAGE_BUCKET` | Yes | `<project-id>.appspot.com` | Stores homework attachments and profile photos. |
| `APP_NAME` | No | `EduConnect` | Application name shown in credential emails. |
| `APP_BASE_URL` | No | `http://localhost:5173` | Base URL shown in credential emails. |
| `SMTP_HOST` | No | — | SMTP server for emailing generated credentials. When unset, credentials are returned to the admin instead. |
| `SMTP_PORT` | No | `587` | SMTP port. |
| `SMTP_SECURE` | No | `false` | Use TLS for SMTP. |
| `SMTP_USER` | No | — | SMTP username. |
| `SMTP_PASS` | No | — | SMTP password. |
| `SMTP_FROM` | No | — | Sender email address for credential emails. Required if `SMTP_HOST` is set. |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Comma-separated browser origins allowed by CORS. |
| `AUTH_RATE_LIMIT_WINDOW_MS` | No | `900000` | Authentication rate-limit window. |
| `AUTH_RATE_LIMIT_MAX` | No | `20` | Requests allowed per IP in the window. |
| `ADMIN_EMAIL` | No | `admin@school.local` | Bootstrap administrator email used by the demo seed to create a Firebase Auth user. |
| `ADMIN_PASSWORD` | Yes (seed) | `replace-with-a-strong-password` | Bootstrap administrator password used by the demo seed to create a Firebase Auth user. Change in production. |

Never commit `backend/.env` or real service-account credentials. See
[`ENVIRONMENT.md`](ENVIRONMENT.md) for the repository's secret-handling rules.

### Admin Panel

The admin panel works without a local environment file when the API uses its
default address. To override it:

```bash
cd admin_panel
cp .env.example .env.local
```

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | No | `http://localhost:8080/api` | Backend API base URL used by browser requests. |

`VITE_*` values are embedded in public browser assets. Never put secrets in
them.

### Flutter Apps

The parent and staff apps do not currently read environment variables or
`--dart-define` values. Both use this API URL in source:

```text
http://localhost:8080/api
```

That address works for web and desktop clients running on the development
machine. It does not refer to the host machine from most device environments:

- Android emulator: use `http://10.0.2.2:8080/api`.
- Physical device: use `http://<development-machine-LAN-IP>:8080/api` and make
  sure the firewall permits the connection.

Until runtime API configuration is added, change `ApiClient.defaultBaseUrl` in
`parent_app/lib/data/api/api_client.dart` or
`staff_app/lib/data/api/api_client.dart` for those targets. The staff Android
development configuration permits cleartext HTTP; production deployments
should use HTTPS.

## Install Dependencies

Install each component independently from the repository root:

```bash
cd backend
npm ci

cd ../admin_panel
npm ci

cd ../parent_app
flutter pub get

cd ../staff_app
flutter pub get
```

Use `npm install` instead of `npm ci` only when intentionally updating a Node
dependency or its lockfile.

## Run the Backend API

```bash
cd backend
npm run dev
```

The API is available at `http://localhost:8080/api`. Verify it at
`http://localhost:8080/health`.

To run the compiled build:

```bash
cd backend
npm run build
npm start
```

## Run the Admin Panel

Start the backend first, then run:

```bash
cd admin_panel
npm run dev
```

Open `http://localhost:5173`. To build and preview the production bundle:

```bash
cd admin_panel
npm run build
npm run preview
```

## Run the Parent App

The parent app currently has Dart source but no generated Flutter platform host
directories. Generate the host for the platform you intend to use once. For
example, for web:

```bash
cd parent_app
flutter create --platforms=web .
flutter pub get
flutter run -d chrome
```

For another supported target, replace `web` with the desired platform, such as
`android`, and select an available device:

```bash
cd parent_app
flutter create --platforms=android .
flutter pub get
flutter devices
flutter run -d <device-id>
```

Platform generation adds or updates generated project files. Review those files
before committing them.

## Run the Staff App

The staff app already includes Android, iOS, web, and desktop platform hosts.

```bash
cd staff_app
flutter devices
flutter run -d <device-id>
```

For example, run the web target with `flutter run -d chrome` or an available
Android emulator using the device ID printed by `flutter devices`.

## Seed Development Data

There is no separate seed command. To seed demo data on startup, set
`SEED_DEMO_DATA=true` in `backend/.env`. When enabled, each backend startup
checks each Firestore collection and seeds it only when that collection is
empty:

```bash
cd backend
SEED_DEMO_DATA=true npm run dev
```

The same automatic seed runs with `npm start`. Firestore data persists across
backend restarts, and existing non-empty collections are not overwritten.

The seed provisions **real Firebase Authentication users** with generated
passwords. Generated passwords are logged to the console during seeding (for
local development only). The bootstrap admin uses the `ADMIN_EMAIL` /
`ADMIN_PASSWORD` env values; all other seeded users receive a random
16-character password that is printed once at startup.

Users cannot create or set their own passwords. When an administrator adds a
new staff or parent via the admin panel, the backend automatically generates a
password, creates a Firebase Auth account, and emails the credentials to the
user's registered email address (when SMTP is configured). When SMTP is not
configured, the generated credentials are returned to the administrator for
manual delivery.
