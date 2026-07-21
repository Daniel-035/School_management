import 'dart:async';
import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:staff_app/core/observability/app_log.dart';

class ApiException implements Exception {
  final int statusCode;
  final String code;
  final String message;
  ApiException(
      {required this.statusCode, required this.code, required this.message});
  @override
  String toString() => 'ApiException($statusCode, $code): $message';
}

class ApiClient {
  ApiClient(
      {String? baseUrl, http.Client? httpClient, Connectivity? connectivity})
      : baseUrl = baseUrl ?? defaultBaseUrl,
        _http = httpClient ?? http.Client(),
        _connectivity = connectivity ?? Connectivity();

  static const String defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8080/api',
  );
  static const String _tokenKey = 'staff_app.auth_token';
  static const String _refreshTokenKey = 'staff_app.refresh_token';
  static const _secure = FlutterSecureStorage();

  final String baseUrl;
  final http.Client _http;
  final Connectivity _connectivity;
  String? _token;
  String? _refreshToken;
  Future<String?>? _refreshing;
  final _expiredController = StreamController<void>.broadcast();

  String? get token => _token;
  String? get refreshToken => _refreshToken;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;
  Stream<void> get onSessionExpired => _expiredController.stream;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    try {
      _token = await _secure.read(key: _tokenKey) ?? prefs.getString(_tokenKey);
      _refreshToken = await _secure.read(key: _refreshTokenKey) ??
          prefs.getString(_refreshTokenKey);
    } catch (_) {
      _token = prefs.getString(_tokenKey);
      _refreshToken = prefs.getString(_refreshTokenKey);
    }
  }

  Future<bool> get hasNetwork async {
    final result = await _connectivity.checkConnectivity();
    return !result.contains(ConnectivityResult.none);
  }

  Future<void> setToken(String? token, {String? refreshToken}) async {
    _token = token;
    _refreshToken = refreshToken ?? _refreshToken;
    final prefs = await SharedPreferences.getInstance();
    if (token == null || token.isEmpty) {
      await prefs.remove(_tokenKey);
      await prefs.remove(_refreshTokenKey);
      try {
        await _secure.delete(key: _tokenKey);
        await _secure.delete(key: _refreshTokenKey);
      } catch (_) {}
      _refreshToken = null;
    } else {
      await prefs.setString(_tokenKey, token);
      if (_refreshToken != null) {
        await prefs.setString(_refreshTokenKey, _refreshToken!);
      }
      try {
        await _secure.write(key: _tokenKey, value: token);
        if (_refreshToken != null) {
          await _secure.write(key: _refreshTokenKey, value: _refreshToken);
        }
      } catch (_) {}
    }
  }

  Future<void> updateRefreshToken(String? refreshToken) async {
    _refreshToken = refreshToken;
    final prefs = await SharedPreferences.getInstance();
    if (refreshToken == null || refreshToken.isEmpty) {
      await prefs.remove(_refreshTokenKey);
      try {
        await _secure.delete(key: _refreshTokenKey);
      } catch (_) {}
    } else {
      await prefs.setString(_refreshTokenKey, refreshToken);
      try {
        await _secure.write(key: _refreshTokenKey, value: refreshToken);
      } catch (_) {}
    }
  }

  Map<String, String> _headers({bool jsonBody = false}) {
    final headers = <String, String>{'Accept': 'application/json'};
    if (jsonBody) headers['Content-Type'] = 'application/json';
    if (_token != null && _token!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) async {
    return _send(
      'GET',
      path,
      _buildUri(path, query: query),
      (uri) => _http.get(uri, headers: _headers()),
    );
  }

  Future<dynamic> post(String path, {Object? body}) async {
    return _send(
      'POST',
      path,
      _buildUri(path),
      (uri) => _http.post(
        uri,
        headers: _headers(jsonBody: body != null),
        body: body == null ? null : jsonEncode(body),
      ),
    );
  }

  Future<dynamic> put(String path, {Object? body}) async {
    return _send(
      'PUT',
      path,
      _buildUri(path),
      (uri) => _http.put(
        uri,
        headers: _headers(jsonBody: body != null),
        body: body == null ? null : jsonEncode(body),
      ),
    );
  }

  Future<dynamic> delete(String path) async {
    return _send(
      'DELETE',
      path,
      _buildUri(path),
      (uri) => _http.delete(uri, headers: _headers()),
    );
  }

  Future<dynamic> upload(String path,
      {required List<String> attachmentUris,
      Map<String, String> fields = const {}}) async {
    return {'attachments': attachmentUris, 'fields': fields};
  }

  Uri _buildUri(String path, {Map<String, dynamic>? query}) {
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    final queryParameters = <String, String>{};
    query?.forEach((key, value) {
      if (value != null) queryParameters[key] = value.toString();
    });
    return Uri.parse('$baseUrl$normalizedPath').replace(
        queryParameters: queryParameters.isEmpty ? null : queryParameters);
  }

  Future<dynamic> _send(
    String method,
    String path,
    Uri uri,
    Future<http.Response> Function(Uri uri) request, {
    bool retried = false,
  }) async {
    final stopwatch = Stopwatch()..start();
    AppLog.info('$method $uri');
    try {
      final response = await request(uri).timeout(const Duration(seconds: 20));
      AppLog.info(
        '$method ${uri.path} -> ${response.statusCode} '
        '(${stopwatch.elapsedMilliseconds}ms)',
      );
      if (response.statusCode == 401 &&
          !retried &&
          path != '/auth/login' &&
          path != '/auth/refresh') {
        final refreshed = await _tryRefresh();
        if (refreshed) {
          return _send(method, path, uri, request, retried: true);
        }
        await setToken(null);
        _expiredController.add(null);
      }
      return _parse(response);
    } on TimeoutException catch (error, stackTrace) {
      AppLog.error(
        '$method $uri timed out after ${stopwatch.elapsedMilliseconds}ms',
        error: error,
        stackTrace: stackTrace,
      );
      rethrow;
    } catch (error, stackTrace) {
      AppLog.error(
        '$method $uri failed after ${stopwatch.elapsedMilliseconds}ms',
        error: error,
        stackTrace: stackTrace,
      );
      rethrow;
    }
  }

  dynamic _parse(http.Response response) {
    final status = response.statusCode;
    final raw = response.body.isEmpty ? '{}' : response.body;
    dynamic decoded;
    try {
      decoded = jsonDecode(raw);
    } catch (_) {
      decoded = <String, dynamic>{};
    }
    if (decoded is Map<String, dynamic>) {
      final success = decoded['success'] == true;
      if (!success) {
        final err = decoded['error'];
        final code =
            err is Map ? (err['code']?.toString() ?? 'UNKNOWN') : 'UNKNOWN';
        final message = err is Map
            ? (err['message']?.toString() ?? 'Request failed')
            : (decoded['message']?.toString() ?? 'Request failed');
        throw ApiException(statusCode: status, code: code, message: message);
      }
      return decoded['data'];
    }
    if (status >= 200 && status < 300) return decoded;
    throw ApiException(
        statusCode: status, code: 'HTTP_ERROR', message: 'Unexpected response');
  }

  Future<bool> _tryRefresh() async {
    final existing = _refreshing;
    if (existing != null) {
      final token = await existing;
      return token != null;
    }
    final pending = _doRefresh();
    _refreshing = pending;
    final token = await pending;
    return token != null;
  }

  Future<String?> _doRefresh() async {
    if (_refreshToken == null || _refreshToken!.isEmpty) return null;
    try {
      final response = await _http
          .post(
            _buildUri('/auth/refresh'),
            headers: const {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: jsonEncode({'refreshToken': _refreshToken}),
          )
          .timeout(const Duration(seconds: 20));
      final data = _parse(response);
      if (data is! Map<String, dynamic>) return null;
      final token = (data['accessToken'] ?? data['token'] ?? '').toString();
      final nextRefresh = (data['refreshToken'] ?? '').toString();
      if (token.isEmpty) return null;
      await setToken(token,
          refreshToken: nextRefresh.isEmpty ? null : nextRefresh);
      return token;
    } catch (_) {
      return null;
    } finally {
      _refreshing = null;
    }
  }

  void dispose() {
    _expiredController.close();
  }
}
