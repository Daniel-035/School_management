// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'School Companion';

  @override
  String get appTagline => 'Stay close to your child\'s day';

  @override
  String get signIn => 'Sign in';

  @override
  String get signOut => 'Sign out';

  @override
  String get biometricSignIn => 'Use biometrics to sign in';

  @override
  String get biometricPrompt => 'Unlock School Companion';

  @override
  String get dashboard => 'Home';

  @override
  String get attendance => 'Attendance';

  @override
  String get academics => 'Academics';

  @override
  String get fees => 'Fees';

  @override
  String get inbox => 'Inbox';

  @override
  String get notices => 'Notices';

  @override
  String get messages => 'Messages';

  @override
  String get noAnnouncements => 'No announcements';

  @override
  String get noConversations => 'No conversations yet';

  @override
  String get noConversationsHint =>
      'You can message your child\'s class teacher once assigned.';

  @override
  String get noChildLinked => 'No child linked to this account';

  @override
  String get noChildLinkedHint =>
      'Please contact the school office to link a child.';

  @override
  String get noNewNotices => 'No new notices';

  @override
  String get noUpcomingEvents => 'No upcoming events';

  @override
  String get noAttendanceData => 'No attendance data yet';

  @override
  String get todayAtAGlance => 'Today at a glance';

  @override
  String get upcomingThisMonth => 'Upcoming this month';

  @override
  String get seeAll => 'See all';

  @override
  String get switchChild => 'Switch child';

  @override
  String get calendar => 'Calendar';

  @override
  String get profile => 'Profile';

  @override
  String get language => 'Language';

  @override
  String get darkMode => 'Dark mode';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageHindi => 'हिन्दी';

  @override
  String get languageSystem => 'System default';

  @override
  String get themeLight => 'Light';

  @override
  String get themeDark => 'Dark';

  @override
  String get themeSystem => 'System';

  @override
  String get addToCalendar => 'Add to device calendar';

  @override
  String get share => 'Share';

  @override
  String get download => 'Download';

  @override
  String get receipt => 'Receipt';

  @override
  String get reportCard => 'Report card';

  @override
  String get applyForLeave => 'Apply for leave';

  @override
  String get leaveHistory => 'Leave history';

  @override
  String get paymentHistory => 'Payment history';

  @override
  String get outstanding => 'Outstanding';

  @override
  String get totalPaid => 'Total paid';

  @override
  String get noPayments => 'No payments yet';

  @override
  String get noLeaveRequests => 'No leave requests yet';

  @override
  String get notifications => 'Notifications';

  @override
  String get markAllRead => 'Mark all as read';

  @override
  String get noNotifications => 'No notifications yet';

  @override
  String get helpSupport => 'Help & support';

  @override
  String get privacySecurity => 'Privacy & security';

  @override
  String get linkedChildren => 'Linked children';

  @override
  String get loading => 'Loading…';

  @override
  String get retry => 'Try again';

  @override
  String get cancel => 'Cancel';

  @override
  String get save => 'Save';

  @override
  String get send => 'Send';

  @override
  String payNow(String amount) {
    return 'Pay $amount';
  }

  @override
  String get paymentSuccessful => 'Payment successful';

  @override
  String get paymentFailed => 'Payment failed. Please try again.';

  @override
  String get paymentCancelled => 'Payment cancelled.';

  @override
  String get networkError =>
      'Couldn\'t reach the server. Check your connection.';

  @override
  String get unauthorized => 'Your session has expired. Please sign in again.';

  @override
  String get serverError => 'Something went wrong. Please try again.';

  @override
  String get typeMessage => 'Type a message';

  @override
  String get messagingOutsideHours =>
      'Outside school hours. Messages will be delivered when school reopens.';

  @override
  String get skeletonLoading => 'Loading…';

  @override
  String get skip => 'Skip';

  @override
  String get getStarted => 'Get started';

  @override
  String get onboardingTitle1 => 'Track every school day';

  @override
  String get onboardingBody1 =>
      'See attendance, marks, and notices in one place.';

  @override
  String get onboardingTitle2 => 'Pay fees in seconds';

  @override
  String get onboardingBody2 =>
      'Pay securely with UPI, cards, and netbanking and get instant receipts.';

  @override
  String get onboardingTitle3 => 'Stay close to the classroom';

  @override
  String get onboardingBody3 =>
      'Chat with teachers, get reminders, and never miss a school event.';

  @override
  String get addedToCalendar => 'Added to your calendar';

  @override
  String get couldNotAddToCalendar =>
      'Couldn\'t add the event to your calendar';

  @override
  String get copiedToClipboard => 'Copied to clipboard';

  @override
  String get present => 'Present';

  @override
  String get absent => 'Absent';

  @override
  String get late => 'Late';

  @override
  String get onLeave => 'On leave';

  @override
  String get presentToday => 'Present today';

  @override
  String get absentToday => 'Absent today';

  @override
  String get lateToday => 'Late today';

  @override
  String get onLeaveToday => 'On leave today';

  @override
  String get feesBreakdown => 'Fee breakdown';

  @override
  String get academicYear => 'Academic year 2025–26';

  @override
  String get paid => 'Paid';

  @override
  String get partial => 'Partial';

  @override
  String get due => 'Due';

  @override
  String get overdue => 'Overdue';

  @override
  String get dueToday => 'Due today';

  @override
  String dueInDays(Object days) {
    return 'Due in ${days}d';
  }

  @override
  String overdueDays(Object days) {
    return 'Overdue ${days}d';
  }
}
