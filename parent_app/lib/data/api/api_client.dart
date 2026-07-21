import 'dart:async';
import 'dart:convert';
import 'dart:io' show Platform, SocketException;

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiException implements Exception {
  final int? statusCode;
  final String code;
  final String message;
  const ApiException(this.message, {this.statusCode, this.code = 'error'});

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({String? baseUrl, http.Client? httpClient})
      : _baseUrl = baseUrl ?? defaultBaseUrl,
        _http = httpClient ?? http.Client();

  static const String defaultBaseUrl = 'http://localhost:8080/api';
  static const String _accessTokenKey = 'auth_token';
  static const String _refreshTokenKey = 'auth_refresh_token';
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage();

  final String _baseUrl;
  final http.Client _http;
  String? _token;
  String? _refreshToken;
  Future<String?>? _refreshing;
  final _expiredController = StreamController<void>.broadcast();

  String get baseUrl => _baseUrl;
  Stream<void> get onSessionExpired => _expiredController.stream;

  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    try {
      _token = await _secureStorage.read(key: _accessTokenKey) ?? prefs.getString(_accessTokenKey);
      _refreshToken = await _secureStorage.read(key: _refreshTokenKey) ?? prefs.getString(_refreshTokenKey);
    } catch (_) {
      _token = prefs.getString(_accessTokenKey);
      _refreshToken = prefs.getString(_refreshTokenKey);
    }
  }

  Future<void> setTokens({String? accessToken, String? refreshToken}) async {
    _token = accessToken;
    if (refreshToken != null) _refreshToken = refreshToken;
    final prefs = await SharedPreferences.getInstance();
    if (accessToken == null) {
      await prefs.remove(_accessTokenKey);
      try { await _secureStorage.delete(key: _accessTokenKey); } catch (_) {}
    } else {
      await prefs.setString(_accessTokenKey, accessToken);
      try { await _secureStorage.write(key: _accessTokenKey, value: accessToken); } catch (_) {}
    }
    if (refreshToken == null) {
      await prefs.remove(_refreshTokenKey);
      try { await _secureStorage.delete(key: _refreshTokenKey); } catch (_) {}
    } else {
      await prefs.setString(_refreshTokenKey, refreshToken);
      try { await _secureStorage.write(key: _refreshTokenKey, value: refreshToken); } catch (_) {}
    }
  }

  Future<void> clearTokens() => setTokens(accessToken: null, refreshToken: null);

  String? get token => _token;
  String? get refreshToken => _refreshToken;
  bool get hasToken => _token != null && _token!.isNotEmpty;

  Map<String, String> _headers({bool json = true}) {
    final h = <String, String>{};
    if (json) h['Content-Type'] = 'application/json';
    h['Accept'] = 'application/json';
    if (_token != null) h['Authorization'] = 'Bearer $_token';
    return h;
  }

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final base = Uri.parse(_baseUrl);
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    final cleaned = <String, String>{};
    query?.forEach((k, v) {
      if (v == null) return;
      cleaned[k] = v.toString();
    });
    return base.replace(
      path: '${base.path}$normalizedPath',
      queryParameters: cleaned.isEmpty ? null : cleaned,
    );
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _send(() => _http.get(_uri(path, query), headers: _headers(json: false)), path);

  Future<dynamic> post(String path, {Object? body}) =>
      _send(() => _http.post(_uri(path),
          headers: _headers(), body: body == null ? null : jsonEncode(body)), path,
          body: body);

  Future<dynamic> put(String path, {Object? body}) =>
      _send(() => _http.put(_uri(path),
          headers: _headers(), body: body == null ? null : jsonEncode(body)), path,
          body: body);

  Future<dynamic> delete(String path) =>
      _send(() => _http.delete(_uri(path), headers: _headers(json: false)), path);

  Future<dynamic> _send(
    Future<http.Response> Function() sender,
    String path, {
    Object? body,
    bool retried = false,
  }) async {
    try {
      final res = await sender();
      if (res.statusCode == 401 && !retried && path != '/auth/login' && path != '/auth/refresh') {
        final refreshed = await _tryRefresh();
        if (refreshed) {
          return _send(sender, path, body: body, retried: true);
        }
        await clearTokens();
        _expiredController.add(null);
      }
      return _parse(res);
    } on SocketException catch (e) {
      throw ApiException(_friendlyMessage(e), code: 'network');
    } on http.ClientException catch (e) {
      throw ApiException(_friendlyMessage(e), code: 'network');
    } on TimeoutException {
      throw const ApiException(
        'The server is taking too long to respond. Please try again.',
        code: 'timeout',
      );
    }
  }

  Future<bool> _tryRefresh() async {
    final existing = _refreshing;
    if (existing != null) {
      final token = await existing;
      return token != null;
    }
    final pending = _doRefresh();
    _refreshing = pending.then<String?>((value) => value).whenComplete(() {
      _refreshing = null;
    });
    final token = await pending;
    return token != null;
  }

  Future<String?> _doRefresh() async {
    if (_refreshToken == null) return null;
    try {
      final res = await _http.post(
        _uri('/auth/refresh'),
        headers: const {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: jsonEncode({'refreshToken': _refreshToken}),
      );
      final data = _parse(res) as Map<String, dynamic>;
      final token = (data['accessToken'] ?? data['token']) as String?;
      final nextRefresh = data['refreshToken'] as String?;
      if (token == null) return null;
      await setTokens(accessToken: token, refreshToken: nextRefresh);
      return token;
    } catch (_) {
      return null;
    }
  }

  dynamic _parse(http.Response res) {
    final status = res.statusCode;
    dynamic body;
    if (res.body.isNotEmpty) {
      try {
        body = jsonDecode(res.body);
      } catch (_) {
        body = res.body;
      }
    }
    if (status >= 200 && status < 300) {
      if (body is Map<String, dynamic> && body['success'] == true) {
        return body['data'];
      }
      return body;
    }
    String message = _statusFallback(status);
    String code = 'error';
    if (body is Map<String, dynamic>) {
      final err = body['error'];
      if (err is Map<String, dynamic>) {
        code = (err['code'] as String?) ?? code;
        message = (err['message'] as String?) ?? message;
      } else if (body['message'] is String) {
        message = body['message'] as String;
      }
    }
    throw ApiException(message, statusCode: status, code: code);
  }

  String _statusFallback(int status) {
    if (status == 401) return 'Your session has expired. Please sign in again.';
    if (status == 403) return 'You don\'t have permission to do that.';
    if (status == 404) return 'We couldn\'t find what you were looking for.';
    if (status == 429) return 'Too many requests. Please slow down and try again.';
    if (status >= 500) return 'Our server is having trouble. Please try again in a moment.';
    return 'Request failed ($status)';
  }

  String _friendlyMessage(Object error) {
    if (kIsWeb) return 'Couldn\'t reach the server. Check your connection.';
    if (Platform.isAndroid || Platform.isIOS) {
      return 'Couldn\'t reach the server. Check your internet connection.';
    }
    return 'Network error. Please check your connection.';
  }

  void dispose() {
    _expiredController.close();
  }
}
