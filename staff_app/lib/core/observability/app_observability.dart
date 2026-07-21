import 'dart:async';

import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

class AppObservability {
  AppObservability._();

  static Future<void> bootstrap(
      {required FutureOr<void> Function() appRunner}) async {
    WidgetsFlutterBinding.ensureInitialized();
    const sentryDsn = String.fromEnvironment('SENTRY_DSN');
    Future<void> run() async {
      await _initFirebase();
      await appRunner();
    }

    if (sentryDsn.isEmpty) {
      await run();
      return;
    }

    await SentryFlutter.init(
      (options) {
        options.dsn = sentryDsn;
        options.environment = const String.fromEnvironment('APP_ENV',
            defaultValue: 'development');
        options.tracesSampleRate = double.tryParse(
                const String.fromEnvironment('SENTRY_TRACES_SAMPLE_RATE',
                    defaultValue: '0.1')) ??
            0.1;
      },
      appRunner: run,
    );
  }

  static Future<void> _initFirebase() async {
    try {
      await Firebase.initializeApp();
      FlutterError.onError =
          FirebaseCrashlytics.instance.recordFlutterFatalError;
      PlatformDispatcher.instance.onError = (error, stack) {
        FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
        return true;
      };
      await FirebaseAnalytics.instance
          .setAnalyticsCollectionEnabled(!kDebugMode);
    } catch (_) {
      // Firebase config is intentionally optional for local/test runs.
    }
  }
}
