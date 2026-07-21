import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';

class StaffNotification {
  const StaffNotification(
      {required this.id,
      required this.title,
      required this.body,
      required this.createdAt,
      this.read = false});

  final String id;
  final String title;
  final String body;
  final DateTime createdAt;
  final bool read;

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'createdAt': createdAt.toIso8601String(),
        'read': read,
      };

  factory StaffNotification.fromJson(Map<String, dynamic> json) =>
      StaffNotification(
        id: (json['id'] ?? '').toString(),
        title: (json['title'] ?? '').toString(),
        body: (json['body'] ?? '').toString(),
        createdAt: DateTime.tryParse((json['createdAt'] ?? '').toString()) ??
            DateTime.now(),
        read: json['read'] == true,
      );

  StaffNotification markRead() => StaffNotification(
      id: id, title: title, body: body, createdAt: createdAt, read: true);
}

class PushService {
  static const _key = 'staff_app.notifications';
  final _controller = StreamController<StaffNotification>.broadcast();
  bool _initialized = false;
  bool _firebaseAvailable = false;

  Stream<StaffNotification> get stream => _controller.stream;
  bool get firebaseAvailable => _firebaseAvailable;

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;
    try {
      await Firebase.initializeApp();
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission();
      FirebaseMessaging.onMessage.listen((message) {
        final notification = message.notification;
        addNotification(
          title: notification?.title ?? 'School update',
          body: notification?.body ?? 'You have a new update',
        );
      });
      _firebaseAvailable = true;
    } catch (_) {
      _firebaseAvailable = false;
    }
  }

  Future<List<StaffNotification>> loadNotifications() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_key) ?? const [];
    return raw
        .map((item) => StaffNotification.fromJson(
            Map<String, dynamic>.from(Uri.splitQueryString(item))))
        .toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  Future<void> addNotification(
      {required String title, required String body}) async {
    final notification = StaffNotification(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      title: title,
      body: body,
      createdAt: DateTime.now(),
    );
    final notifications = await loadNotifications();
    notifications.insert(0, notification);
    await _save(notifications);
    _controller.add(notification);
  }

  Future<void> markAllRead() async {
    final notifications = await loadNotifications();
    await _save(notifications.map((item) => item.markRead()).toList());
  }

  Future<void> _save(List<StaffNotification> notifications) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(
        _key,
        notifications
            .map((item) => Uri(
                    queryParameters: item
                        .toJson()
                        .map((key, value) => MapEntry(key, value.toString())))
                .query)
            .toList());
  }
}
