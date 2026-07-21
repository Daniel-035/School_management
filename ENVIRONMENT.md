# Environment Configuration

## Source of truth

Configuration names, expected formats, and safe development defaults are defined
in the committed templates below. Update the applicable template and this file in
the same change whenever configuration is added, renamed, or removed.

| Component | Canonical contract | Local values | Deployed values |
| --- | --- | --- | --- |
| Backend | `backend/.env.example` | `backend/.env` | Runtime environment and secret manager |
| Admin panel | `admin_panel/.env.example` | `admin_panel/.env.local` | Hosting provider build environment |
| Parent and staff apps | Firebase Console project plus FlutterFire CLI | Generated platform files | CI secret/file injection or generated release files |

Templates contain variable names and non-sensitive examples only. Never put a
real secret in an `*.example` file.

## Backend variables

Copy `backend/.env.example` to `backend/.env` for local development.

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Express listen port; defaults to `8080`. |
| `NODE_ENV` | No | Runtime mode: `development`, `test`, or `production`. |
| `JWT_SECRET` | Yes | Long random signing secret. Use a different secret in every environment. |
| `JWT_EXPIRES_IN` | No | Access-token lifetime accepted by `jsonwebtoken`, such as `15m` or `1h`; defaults to `15m`. |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | No | Rotating refresh-token session lifetime in days; defaults to `30`. |
| `BCRYPT_ROUNDS` | No | bcrypt work factor from `10` through `15`; defaults to `12`. |
| `FIRESTORE_PROJECT_ID` | Yes | Google Cloud/Firebase project ID used by Firebase Admin. |
| `FIREBASE_SERVICE_ACCOUNT` | Local non-emulator use | Entire minified service-account JSON object. Cloud Run uses Application Default Credentials instead. |
| `FIREBASE_STORAGE_BUCKET` | Yes | Cloud Storage bucket used for uploads and signed URLs. |
| `CORS_ORIGINS` | No | Comma-separated browser origins; defaults to `http://localhost:5173`. |
| `AUTH_RATE_LIMIT_WINDOW_MS` | No | Authentication rate-limit window in milliseconds. |
| `AUTH_RATE_LIMIT_MAX` | No | Maximum requests per IP in each authentication rate-limit window. |
| `SEED_DEMO_DATA` | No | Set to `true` only when demo records should be inserted at startup; defaults to `false`. |
| `ADMIN_EMAIL` | No | Bootstrap administrator email used by the current development seed. |
| `ADMIN_PASSWORD` | No | Bootstrap administrator password. Treat it as a secret outside disposable local data. |

Production secrets belong in the deployment platform's secret manager, not in a
committed env file. `FIREBASE_SERVICE_ACCOUNT` must never be exposed to the
admin panel or either Flutter application.

## Admin panel variables

Copy `admin_panel/.env.example` to `admin_panel/.env.local` for local overrides.

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | No | Backend API base URL; defaults in code to `http://localhost:8080/api`. |

All `VITE_*` variables are embedded in browser assets and are public. Do not use
them for passwords, private keys, service accounts, or other server credentials.

## Firebase client configuration

The Firebase Console project is the source of truth for client app registrations.
Generate Flutter configuration with FlutterFire CLI rather than editing generated
values by hand:

```bash
flutterfire configure --project=your-firebase-project-id
```

Run the command separately in `parent_app` and `staff_app`, selecting the app
registrations for the intended environment. It may create these local files:

- `lib/firebase_options.dart`
- `android/app/google-services.json`
- `ios/Runner/GoogleService-Info.plist`
- `macos/Runner/GoogleService-Info.plist`

These environment-specific generated files are ignored by the shared
`.gitignore`. CI and release workflows must generate or inject the matching files
for their target environment. Firebase web/mobile API keys identify a Firebase
project but do not authorize Admin SDK access; authorization must still be
enforced with Firebase Security Rules and backend access controls.

## Change process

1. Add or rename the setting in the component's committed `.env.example`.
2. Update runtime validation and this document in the same change.
3. Configure the value in local ignored files and each deployment environment.
4. Rotate the credential immediately if a real secret is committed or logged.
