import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'core/observability/app_observability.dart';
import 'core/providers.dart';
import 'data/api/api_client.dart';
import 'data/notifications/notification_store.dart';

Future<void> main() async {
  await AppObservability.bootstrap(appRunner: () async {
    final prefs = await SharedPreferences.getInstance();
    final apiClient = ApiClient();
    await apiClient.loadToken();
    final notificationStore = await NotificationStore.load();
    runApp(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
          apiClientProvider.overrideWithValue(apiClient),
          notificationStoreProvider.overrideWithValue(notificationStore),
        ],
        child: const SchoolCompanionApp(),
      ),
    );
  });
}
