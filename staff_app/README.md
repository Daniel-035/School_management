# Staff App

Flutter mobile app for school staff (teachers, class coordinators, operational staff).

## Features (per PRD)

- **Dashboard** — daily schedule, pending tasks, recent announcements
- **Attendance Management** — daily / subject-wise attendance, monthly reports
- **Homework & Assignments** — create, assign, collect; attach docs/images/links
- **Examination & Grading** — marks entry, performance analytics
- **Communication** — direct messages to parents (admin oversight), class noticeboard
- **Timetable Viewer** — personal daily teaching schedule

## Architecture

Feature-first clean architecture:

```
lib/
  core/           # theme, routing, constants
  data/           # models, mock services, repositories
  features/
    dashboard/
    attendance/
    homework/
    examination/
    communication/
    timetable/
    shell/        # bottom-nav scaffold
  app.dart
  main.dart
```

## Getting started

```bash
flutter pub get
flutter run
```

The API defaults to `http://localhost:8080/api`. Override it for deployed
environments or physical devices:

```bash
flutter run --dart-define=API_BASE_URL=https://api.example.com/api
```

For an Android emulator, use `http://10.0.2.2:8080/api`. For a physical
device, use the development machine's LAN IP and ensure port 8080 is allowed
through the firewall.
