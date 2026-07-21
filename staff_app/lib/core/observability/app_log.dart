import 'dart:developer' as developer;

import 'package:flutter/foundation.dart';

class AppLog {
  AppLog._();

  static void info(String message) {
    developer.log(message, name: 'staff_app');
    if (kDebugMode) debugPrint('[staff_app] $message');
  }

  static void error(
    String message, {
    Object? error,
    StackTrace? stackTrace,
  }) {
    developer.log(
      message,
      name: 'staff_app',
      level: 1000,
      error: error,
      stackTrace: stackTrace,
    );
    if (kDebugMode) {
      debugPrint(
          '[staff_app][error] $message${error == null ? '' : ': $error'}');
      if (stackTrace != null) debugPrintStack(stackTrace: stackTrace);
    }
  }
}
