import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

class AppNotification {
  final String id;
  final String title;
  final String body;
  final DateTime receivedAt;
  final String? type;
  final String? deepLink;
  bool read;

  AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.receivedAt,
    this.type,
    this.deepLink,
    this.read = false,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'receivedAt': receivedAt.toIso8601String(),
        'type': type,
        'deepLink': deepLink,
        'read': read,
      };

  factory AppNotification.fromJson(Map<String, dynamic> j) => AppNotification(
        id: j['id'] as String,
        title: (j['title'] as String?) ?? '',
        body: (j['body'] as String?) ?? '',
        receivedAt: DateTime.tryParse(j['receivedAt']?.toString() ?? '') ??
            DateTime.now(),
        type: j['type'] as String?,
        deepLink: j['deepLink'] as String?,
        read: (j['read'] as bool?) ?? false,
      );
}

class NotificationStore {
  NotificationStore._(this._prefs, this._items);
  static const _key = 'local_notifications';
  final SharedPreferences _prefs;
  final List<AppNotification> _items;
  final _controller = ValueNotifier<int>(0);
  ValueListenable<int> get changes => _controller;

  static Future<NotificationStore> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    final items = <AppNotification>[];
    if (raw != null) {
      try {
        final list = jsonDecode(raw) as List<dynamic>;
        for (final item in list.whereType<Map<String, dynamic>>()) {
          items.add(AppNotification.fromJson(item));
        }
      } catch (_) {
        // ignore corrupt payload
      }
    }
    items.sort((a, b) => b.receivedAt.compareTo(a.receivedAt));
    return NotificationStore._(prefs, items);
  }

  List<AppNotification> get all => List.unmodifiable(_items);
  int get unreadCount => _items.where((n) => !n.read).length;

  Future<void> add({
    required String title,
    required String body,
    String? type,
    String? deepLink,
  }) async {
    final entry = AppNotification(
      id: const Uuid().v4(),
      title: title,
      body: body,
      receivedAt: DateTime.now(),
      type: type,
      deepLink: deepLink,
    );
    _items.insert(0, entry);
    await _persist();
    _controller.value++;
  }

  Future<void> markAllRead() async {
    for (final n in _items) {
      n.read = true;
    }
    await _persist();
    _controller.value++;
  }

  Future<void> clear() async {
    _items.clear();
    await _persist();
    _controller.value++;
  }

  Future<void> _persist() async {
    final raw = jsonEncode(_items.map((e) => e.toJson()).toList());
    await _prefs.setString(_key, raw);
  }
}

class InboxService {
  InboxService({required this.client, required this.store});
  final http.Client client;
  final NotificationStore store;

  Future<void> syncFromServer(String accessToken) async {
    try {
      final res = await client.get(
        Uri.parse('https://fcm.googleapis.com/fcm/send'),
        headers: {'Authorization': 'Bearer $accessToken'},
      );
      if (res.statusCode == 200) {
        // no-op placeholder
      }
    } catch (_) {
      // ignore
    }
  }
}
