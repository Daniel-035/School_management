import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:staff_app/data/school_repository.dart';
import 'package:staff_app/features/attendance/attendance_screen.dart';
import 'package:staff_app/features/auth/login_screen.dart';
import 'package:staff_app/features/communication/communication_screen.dart';
import 'package:staff_app/features/dashboard/dashboard_screen.dart';
import 'package:staff_app/features/examination/examination_screen.dart';
import 'package:staff_app/features/homework/homework_screen.dart';
import 'package:staff_app/features/notifications/notification_tray_screen.dart';
import 'package:staff_app/features/profile/profile_screen.dart';
import 'package:staff_app/features/shell/app_shell.dart';
import 'package:staff_app/features/timetable/timetable_screen.dart';

class _AuthRefresh extends ChangeNotifier {
  _AuthRefresh(this._repo) {
    _repo.addListener(_onChange);
  }
  final SchoolRepository _repo;
  void _onChange() => notifyListeners();
  @override
  void dispose() {
    _repo.removeListener(_onChange);
    super.dispose();
  }
}

class AppRouter {
  AppRouter._();

  static const String login = '/login';
  static const String dashboard = '/';
  static const String attendance = '/attendance';
  static const String homework = '/homework';
  static const String examination = '/examination';
  static const String communication = '/communication';
  static const String timetable = '/timetable';
  static const String profile = '/profile';
  static const String notifications = '/notifications';

  static final _rootKey = GlobalKey<NavigatorState>();
  static final _dashboardKey = GlobalKey<NavigatorState>();
  static final _attendanceKey = GlobalKey<NavigatorState>();
  static final _homeworkKey = GlobalKey<NavigatorState>();
  static final _examinationKey = GlobalKey<NavigatorState>();
  static final _communicationKey = GlobalKey<NavigatorState>();

  static SchoolRepository? _repoInstance;
  static _AuthRefresh? _refreshInstance;

  static void bindRepository(SchoolRepository repo) {
    _repoInstance = repo;
    _refreshInstance?.dispose();
    _refreshInstance = _AuthRefresh(repo);
  }

  static GoRouter buildRouter() {
    final repo = _repoInstance;
    return GoRouter(
      navigatorKey: _rootKey,
      initialLocation: dashboard,
      refreshListenable: _refreshInstance,
      redirect: (context, state) {
        final isAuthed = repo?.isAuthenticated ?? false;
        final goingToLogin = state.matchedLocation == login;
        if (!isAuthed && !goingToLogin) return login;
        if (isAuthed && goingToLogin) return dashboard;
        return null;
      },
      routes: [
        GoRoute(
            parentNavigatorKey: _rootKey,
            path: login,
            builder: (context, state) => const LoginScreen()),
        StatefulShellRoute.indexedStack(
          builder: (context, state, navigationShell) =>
              AppShell(navigationShell: navigationShell),
          branches: [
            StatefulShellBranch(navigatorKey: _dashboardKey, routes: [
              GoRoute(
                  path: dashboard,
                  builder: (context, state) => const DashboardScreen())
            ]),
            StatefulShellBranch(navigatorKey: _attendanceKey, routes: [
              GoRoute(
                  path: attendance,
                  builder: (context, state) => const AttendanceScreen())
            ]),
            StatefulShellBranch(navigatorKey: _homeworkKey, routes: [
              GoRoute(
                  path: homework,
                  builder: (context, state) => const HomeworkScreen())
            ]),
            StatefulShellBranch(navigatorKey: _examinationKey, routes: [
              GoRoute(
                  path: examination,
                  builder: (context, state) => const ExaminationScreen())
            ]),
            StatefulShellBranch(navigatorKey: _communicationKey, routes: [
              GoRoute(
                  path: communication,
                  builder: (context, state) => const CommunicationScreen())
            ]),
          ],
        ),
        GoRoute(
            parentNavigatorKey: _rootKey,
            path: timetable,
            builder: (context, state) => const TimetableScreen()),
        GoRoute(
            parentNavigatorKey: _rootKey,
            path: profile,
            builder: (context, state) => const ProfileScreen()),
        GoRoute(
            parentNavigatorKey: _rootKey,
            path: notifications,
            builder: (context, state) => const NotificationTrayScreen()),
      ],
    );
  }
}
