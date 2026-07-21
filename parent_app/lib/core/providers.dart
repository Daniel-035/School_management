import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../data/api/api_client.dart';
import '../data/models/academics.dart';
import '../data/models/attendance.dart';
import '../data/models/calendar_event.dart';
import '../data/models/communication.dart';
import '../data/models/fees.dart';
import '../data/models/homework.dart';
import '../data/models/student.dart';
import '../data/models/user.dart';
import '../data/notifications/notification_store.dart';
import '../data/notifications/push_service.dart';
import '../data/repositories/academics_repository.dart';
import '../data/repositories/attendance_repository.dart';
import '../data/repositories/auth_repository.dart';
import '../data/repositories/calendar_repository.dart';
import '../data/repositories/communication_repository.dart';
import '../data/repositories/fee_repository.dart';
import '../data/repositories/payment_repository.dart';
import '../data/repositories/student_repository.dart';
import '../data/services/biometric_service.dart';
import '../data/services/calendar_add_service.dart';
import '../data/services/payment_service.dart';
import '../data/services/pdf_service.dart';
import '../core/preferences/app_preferences.dart';

// ---------------------------------------------------------------------------
// Infrastructure providers (overridden in main.dart)
// ---------------------------------------------------------------------------

final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError('sharedPreferencesProvider must be overridden'),
);

final apiClientProvider = Provider<ApiClient>(
  (ref) => throw UnimplementedError('apiClientProvider must be overridden'),
);

final notificationStoreProvider = Provider<NotificationStore>(
  (ref) => throw UnimplementedError('notificationStoreProvider must be overridden'),
);

final appPreferencesProvider = Provider<AppPreferences>(
  (ref) => AppPreferences(ref.watch(sharedPreferencesProvider)),
);

// ---------------------------------------------------------------------------
// Repository providers
// ---------------------------------------------------------------------------

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(apiClientProvider)),
);

final studentRepositoryProvider = Provider<StudentRepository>(
  (ref) => StudentRepository(ref.watch(apiClientProvider)),
);

final attendanceRepositoryProvider = Provider<AttendanceRepository>(
  (ref) => AttendanceRepository(ref.watch(apiClientProvider)),
);

final homeworkRepositoryProvider = Provider<HomeworkRepository>(
  (ref) => HomeworkRepository(ref.watch(apiClientProvider)),
);

final examRepositoryProvider = Provider<ExamRepository>(
  (ref) => ExamRepository(ref.watch(apiClientProvider)),
);

final reportCardRepositoryProvider = Provider<ReportCardRepository>(
  (ref) => ReportCardRepository(ref.watch(apiClientProvider)),
);

final feeRepositoryProvider = Provider<FeeRepository>(
  (ref) => FeeRepository(ref.watch(apiClientProvider)),
);

final paymentRepositoryProvider = Provider<PaymentRepository>(
  (ref) => PaymentRepository(ref.watch(apiClientProvider)),
);

final communicationRepositoryProvider = Provider<CommunicationRepository>(
  (ref) => CommunicationRepository(ref.watch(apiClientProvider)),
);

final calendarRepositoryProvider = Provider<CalendarRepository>(
  (ref) => CalendarRepository(ref.watch(apiClientProvider)),
);

// ---------------------------------------------------------------------------
// Service providers
// ---------------------------------------------------------------------------

final pdfServiceProvider = Provider<PdfService>((ref) => PdfService());

final paymentServiceProvider = Provider<PaymentService>(
  (ref) => PaymentService(pdfService: ref.watch(pdfServiceProvider)),
);

final biometricServiceProvider = Provider<BiometricService>(
  (ref) => BiometricService(),
);

final calendarAddServiceProvider = Provider<CalendarAddService>(
  (ref) => CalendarAddService(),
);

// ---------------------------------------------------------------------------
// Settings controllers (theme, locale, onboarding)
// ---------------------------------------------------------------------------

class ThemeController extends Notifier<ThemeMode> {
  @override
  ThemeMode build() => ref.read(appPreferencesProvider).themeMode;

  Future<void> set(ThemeMode mode) async {
    state = mode;
    await ref.read(appPreferencesProvider).setThemeMode(mode);
  }
}

final themeControllerProvider =
    NotifierProvider<ThemeController, ThemeMode>(ThemeController.new);

class LocaleController extends Notifier<Locale?> {
  @override
  Locale? build() => ref.read(appPreferencesProvider).locale;

  Future<void> set(Locale? value) async {
    state = value;
    await ref.read(appPreferencesProvider).setLocale(value);
  }
}

final localeControllerProvider =
    NotifierProvider<LocaleController, Locale?>(LocaleController.new);

class OnboardingController extends Notifier<bool> {
  @override
  bool build() => ref.read(appPreferencesProvider).onboarded;

  Future<void> complete() async {
    state = true;
    await ref.read(appPreferencesProvider).setOnboarded(true);
  }
}

final onboardingControllerProvider =
    NotifierProvider<OnboardingController, bool>(OnboardingController.new);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

class AuthController extends AsyncNotifier<AppUser?> {
  @override
  Future<AppUser?> build() async {
    return ref.read(authRepositoryProvider).restoreSession();
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(authRepositoryProvider).login(
            email: email,
            password: password,
          ),
    );
  }

  Future<void> logout() async {
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncData(null);
    ref.read(selectedChildIdProvider.notifier).set(null);
  }
}

final authControllerProvider =
    AsyncNotifierProvider<AuthController, AppUser?>(AuthController.new);

// ---------------------------------------------------------------------------
// Child selection
// ---------------------------------------------------------------------------

class SelectedChildController extends Notifier<String?> {
  @override
  String? build() => ref.read(appPreferencesProvider).lastChildId;

  Future<void> set(String? id) async {
    state = id;
    await ref.read(appPreferencesProvider).setLastChildId(id);
  }
}

final selectedChildIdProvider =
    NotifierProvider<SelectedChildController, String?>(SelectedChildController.new);

final linkedChildrenProvider = FutureProvider<List<Student>>((ref) async {
  final parent = ref.watch(authControllerProvider).valueOrNull;
  if (parent == null) return const [];
  return ref.watch(studentRepositoryProvider).childrenOf(parent.id);
});

final selectedStudentProvider = Provider<Student?>((ref) {
  final children =
      ref.watch(linkedChildrenProvider).valueOrNull ?? const <Student>[];
  if (children.isEmpty) return null;
  final selectedId = ref.watch(selectedChildIdProvider);
  if (selectedId != null) {
    final match = children.where((c) => c.id == selectedId).toList();
    if (match.isNotEmpty) return match.first;
  }
  return children.first;
});

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

final attendanceSummaryProvider =
    FutureProvider.family<AttendanceSummary, String>(
  (ref, id) => ref.watch(attendanceRepositoryProvider).summary(id),
);

final attendanceRecordsProvider =
    FutureProvider.family<List<AttendanceRecord>, ({String id, DateTime month})>(
  (ref, params) => ref.watch(attendanceRepositoryProvider).forStudent(
        params.id,
        month: params.month,
      ),
);

final leaveHistoryProvider =
    FutureProvider.family<List<LeaveRequest>, String>(
  (ref, studentId) =>
      ref.watch(attendanceRepositoryProvider).leaveHistory(studentId),
);

// ---------------------------------------------------------------------------
// Fees
// ---------------------------------------------------------------------------

final feeStructuresProvider = FutureProvider<List<FeeStructure>>(
  (ref) => ref.watch(feeRepositoryProvider).structures(),
);

final feePaymentsProvider =
    FutureProvider.family<List<FeePayment>, String>(
  (ref, studentId) =>
      ref.watch(feeRepositoryProvider).paymentsFor(studentId),
);

final feesSummaryProvider = FutureProvider.family<FeeSummary, String>(
  (ref, id) => ref.watch(feeRepositoryProvider).summaryFor(id),
);

// ---------------------------------------------------------------------------
// Communication
// ---------------------------------------------------------------------------

final announcementsProvider = FutureProvider<List<Announcement>>(
  (ref) => ref.watch(communicationRepositoryProvider).announcements(),
);

final threadsProvider = FutureProvider<List<MessageThread>>((ref) async {
  final parent = ref.watch(authControllerProvider).valueOrNull;
  if (parent == null) return const [];
  final repo = ref.watch(communicationRepositoryProvider);
  repo.setCurrentUserId(parent.id);
  return repo.threadsFor(parent.id);
});

final messagesProvider =
    FutureProvider.family<List<ChatMessage>, String>(
  (ref, threadId) async {
    final repo = ref.watch(communicationRepositoryProvider);
    final parent = ref.watch(authControllerProvider).valueOrNull;
    repo.setCurrentUserId(parent?.id);
    return repo.messagesIn(threadId);
  },
);

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

final allEventsProvider = FutureProvider<List<SchoolEvent>>(
  (ref) => ref.watch(calendarRepositoryProvider).all(),
);

final upcomingEventsProvider = FutureProvider<List<SchoolEvent>>(
  (ref) => ref.watch(calendarRepositoryProvider).upcoming(limit: 4),
);

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

class UnreadCountNotifier extends Notifier<int> {
  @override
  int build() {
    final store = ref.watch(notificationStoreProvider);
    void listener() {
      state = store.unreadCount;
    }
    store.changes.addListener(listener);
    ref.onDispose(() => store.changes.removeListener(listener));
    return store.unreadCount;
  }
}

final unreadNotificationCountProvider =
    NotifierProvider<UnreadCountNotifier, int>(UnreadCountNotifier.new);

final pushServiceProvider = FutureProvider<void>((ref) async {
  final store = ref.watch(notificationStoreProvider);
  final service = PushNotificationService(store);
  await service.initialize();
});

// ---------------------------------------------------------------------------
// Academics
// ---------------------------------------------------------------------------

final homeworkPendingProvider =
    FutureProvider.family<List<Homework>, String>(
  (ref, classSectionId) =>
      ref.watch(homeworkRepositoryProvider).pendingForClass(classSectionId),
);

final homeworkOverdueProvider =
    FutureProvider.family<List<Homework>, String>(
  (ref, classSectionId) =>
      ref.watch(homeworkRepositoryProvider).overdueForClass(classSectionId),
);

final reportCardsProvider =
    FutureProvider.family<List<ReportCard>, String>(
  (ref, studentId) =>
      ref.watch(reportCardRepositoryProvider).forStudent(studentId),
);

final examsProvider =
    FutureProvider.family<List<ExamSchedule>, String>(
  (ref, classSectionId) =>
      ref.watch(examRepositoryProvider).upcomingForClass(classSectionId),
);
