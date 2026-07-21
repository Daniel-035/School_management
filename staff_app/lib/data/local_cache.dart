import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class LocalCache {
  LocalCache({this.prefix = 'staff_app.cache'});

  final String prefix;

  Future<void> writeJson(String key, Object value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('$prefix.$key', jsonEncode(value));
  }

  Future<dynamic> readJson(String key) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('$prefix.$key');
    if (raw == null || raw.isEmpty) return null;
    return jsonDecode(raw);
  }

  Future<void> remove(String key) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('$prefix.$key');
  }
}
