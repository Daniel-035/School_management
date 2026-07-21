import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'notification_store.dart';

@pragma('vm:entry-point')
Future<void> _firebaseBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {}
  final notification = message.notification;
  if (notification != null) {
    await _backgroundShow(notification);
  }
}

Future<void> _backgroundShow(RemoteNotification notification) async {
  final plugin = FlutterLocalNotificationsPlugin();
  const channel = AndroidNotificationChannel(
    'educonnect_default',
    'School Companion',
    description: 'General notifications',
    importance: Importance.high,
  );
  try {
    await plugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  } catch (_) {}
  await plugin.show(
    DateTime.now().millisecondsSinceEpoch ~/ 1000,
    notification.title,
    notification.body,
    const NotificationDetails(
      android: AndroidNotificationDetails(
        'educonnect_default',
        'School Companion',
        channelDescription: 'General notifications',
        importance: Importance.high,
        priority: Priority.high,
      ),
      iOS: DarwinNotificationDetails(),
    ),
    payload: notification.android?.clickAction,
  );
}

class PushNotificationService {
  PushNotificationService(this.store);
  final NotificationStore store;
  bool _initialized = false;
  bool _firebaseReady = false;

  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;
    try {
      await Firebase.initializeApp();
      _firebaseReady = true;
    } catch (e) {
      if (kDebugMode) {
        // ignore: avoid_print
        print('Firebase init failed: $e');
      }
      return;
    }

    final messaging = FirebaseMessaging.instance;
    try {
      await messaging.requestPermission(alert: true, badge: true, sound: true);
    } catch (_) {}

    FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundHandler);

    FirebaseMessaging.onMessage.listen((message) {
      final notification = message.notification;
      if (notification == null) return;
      store.add(
        title: notification.title ?? 'School Companion',
        body: notification.body ?? '',
        type: message.data['type']?.toString(),
        deepLink: message.data['deepLink']?.toString(),
      );
      _backgroundShow(notification);
    });

    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      // could be routed to a deep-link destination here.
    });
  }

  Future<String?> getToken() async {
    if (!_firebaseReady) return null;
    try {
      return await FirebaseMessaging.instance.getToken();
    } catch (_) {
      return null;
    }
  }

  Future<void> registerDevice(String accessToken, {required String apiBase}) async {
    if (!_firebaseReady) return;
    try {
      final token = await getToken();
      if (token == null) return;
      // Best-effort device registration. We do not throw on failure
      // because the rest of the app must continue to work even if
      // the device endpoint or FCM is unavailable.
      final platform = defaultTargetPlatform.name;
      await _httpPost('$apiBase/devices', accessToken, {
        'token': token,
        'platform': platform == 'iOS'
            ? 'ios'
            : platform == 'android'
                ? 'android'
                : 'web',
      });
    } catch (_) {}
  }
}

Future<void> _httpPost(String url, String token, Map<String, dynamic> body) async {
  final client = HttpClient();
  try {
    final req = await client.postUrl(Uri.parse(url));
    req.headers.set('Content-Type', 'application/json');
    req.headers.set('Authorization', 'Bearer $token');
    req.write(jsonEncode(body));
    final response = await req.close();
    await response.drain<void>();
  } finally {
    client.close(force: true);
  }
}
