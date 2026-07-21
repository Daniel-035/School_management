import 'package:flutter/material.dart';
import 'package:staff_app/app.dart';
import 'package:staff_app/core/observability/app_observability.dart';

Future<void> main() async {
  await AppObservability.bootstrap(
    appRunner: () => runApp(const StaffApp()),
  );
}
