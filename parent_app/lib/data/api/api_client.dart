import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  final int? statusCode;
  final String code;
  final String message;
  const ApiException(this.message, {this.statusCode, this.code = 'error'});

  @override
  String toString() => message;
}

class HttpClientAdapterWrapper implements HttpClientAdapter {
  final http.Client client;
  HttpClientAdapterWrapper(this.client);

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestBody,
    Future<void>? cancelFuture,
  ) async {
    final List<int> bodyBytes = [];
    if (requestBody != null) {
      await for (var chunk in requestBody) {
        bodyBytes.addAll(chunk);
      }
    }

    final headers = <String, String>{};
    options.headers.forEach((key, value) {
      headers[key] = value.toString();
    });

    final method = options.method;
    final uri = options.uri;

    final request = http.Request(method, uri);
    request.headers.addAll(headers);
    request.bodyBytes = Uint8List.fromList(bodyBytes);

    final response = await client.send(request);

    final responseHeaders = <String, List<String>>{};
    response.headers.forEach((key, value) {
      responseHeaders[key] = [value];
    });

    return ResponseBody(
      response.stream.map((chunk) => Uint8List.fromList(chunk)),
      response.statusCode,
      headers: responseHeaders,
    );
  }

  @override
  void close({bool force = false}) {
    client.close();
  }
}

class ApiClient {
  static const String defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://school-management-b28r.onrender.com/api',
  );
  static const String _accessTokenKey = 'auth_token';
  static const String _refreshTokenKey = 'auth_refresh_token';
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage();

  final String _baseUrl;
  final Dio dio;
  String? _token;
  String? _refreshToken;
  Future<String?>? _refreshing;
  final _expiredController = StreamController<void>.broadcast();

  ApiClient({String? baseUrl, http.Client? httpClient})
      : _baseUrl = baseUrl ?? defaultBaseUrl,
        dio = Dio(BaseOptions(
          baseUrl: baseUrl ?? defaultBaseUrl,
          connectTimeout: const Duration(seconds: 20),
          receiveTimeout: const Duration(seconds: 20),
        )) {
    if (httpClient != null) {
      dio.httpClientAdapter = HttpClientAdapterWrapper(httpClient);
    }
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_token != null) {
          options.headers['Authorization'] = 'Bearer $_token';
        }
        options.headers['Accept'] = 'application/json';
        return handler.next(options);
      },
      onResponse: (response, handler) {
        final decoded = response.data;
        if (decoded is Map<String, dynamic>) {
          final success = decoded['success'] == true;
          if (!success) {
            final err = decoded['error'];
            final code = err is Map ? (err['code']?.toString() ?? 'error') : 'error';
            final message = err is Map
                ? (err['message']?.toString() ?? 'Request failed')
                : (decoded['message']?.toString() ?? 'Request failed');
            return handler.reject(
              DioException(
                requestOptions: response.requestOptions,
                response: response,
                type: DioExceptionType.badResponse,
                error: ApiException(message, statusCode: response.statusCode ?? 500, code: code),
              ),
            );
          }
        }
        return handler.next(response);
      },
      onError: (DioException err, handler) async {
        final status = err.response?.statusCode;
        final path = err.requestOptions.path;

        if (status == 401 && path != '/auth/login' && path != '/auth/refresh') {
          try {
            final refreshed = await _tryRefresh();
            if (refreshed) {
              final options = err.requestOptions;
              options.headers['Authorization'] = 'Bearer $_token';
              final retryResponse = await dio.fetch<dynamic>(options);
              return handler.resolve(retryResponse);
            }
          } catch (_) {}
          await clearTokens();
          _expiredController.add(null);
        }

        if (err.response?.data is Map<String, dynamic>) {
          final decoded = err.response!.data as Map<String, dynamic>;
          final success = decoded['success'] == true;
          if (!success) {
            final errObj = decoded['error'];
            final code = errObj is Map ? (errObj['code']?.toString() ?? 'error') : 'error';
            final message = errObj is Map
                ? (errObj['message']?.toString() ?? 'Request failed')
                : (decoded['message']?.toString() ?? 'Request failed');
            return handler.next(
              DioException(
                requestOptions: err.requestOptions,
                response: err.response,
                type: err.type,
                error: ApiException(message, statusCode: status ?? 500, code: code),
              ),
            );
          }
        }

        return handler.next(err);
      },
    ));
  }

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

  Future<void> setTokens({String? accessToken, String? refreshToken, bool clearRefreshToken = false}) async {
    _token = accessToken;
    if (refreshToken != null) {
      _refreshToken = refreshToken;
    } else if (clearRefreshToken) {
      _refreshToken = null;
    }
    final prefs = await SharedPreferences.getInstance();
    if (accessToken == null) {
      await prefs.remove(_accessTokenKey);
      try { await _secureStorage.delete(key: _accessTokenKey); } catch (_) {}
    } else {
      await prefs.setString(_accessTokenKey, accessToken);
      try { await _secureStorage.write(key: _accessTokenKey, value: accessToken); } catch (_) {}
    }
    if (refreshToken == null && clearRefreshToken) {
      await prefs.remove(_refreshTokenKey);
      try { await _secureStorage.delete(key: _refreshTokenKey); } catch (_) {}
    } else if (refreshToken != null) {
      await prefs.setString(_refreshTokenKey, refreshToken);
      try { await _secureStorage.write(key: _refreshTokenKey, value: refreshToken); } catch (_) {}
    }
  }

  Future<void> clearTokens() => setTokens(accessToken: null, refreshToken: null, clearRefreshToken: true);

  String? get token => _token;
  String? get refreshToken => _refreshToken;
  bool get hasToken => _token != null && _token!.isNotEmpty;

  String _buildUrl(String path) {
    final cleanPath = path.startsWith('/') ? path : '/$path';
    final cleanBase = _baseUrl.endsWith('/') ? _baseUrl.substring(0, _baseUrl.length - 1) : _baseUrl;
    return '$cleanBase$cleanPath';
  }

  dynamic _processResponse(Response<dynamic> response) {
    var data = response.data;
    if (data is String && data.isNotEmpty) {
      try {
        data = jsonDecode(data);
      } catch (_) {}
    }
    if (data is Map<String, dynamic>) {
      final success = data['success'] == true;
      if (!success) {
        final err = data['error'];
        final code = err is Map ? (err['code']?.toString() ?? 'error') : 'error';
        final message = err is Map
            ? (err['message']?.toString() ?? 'Request failed')
            : (data['message']?.toString() ?? 'Request failed');
        throw ApiException(message, statusCode: response.statusCode ?? 500, code: code);
      }
      return data['data'];
    }
    return data;
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) async {
    try {
      final response = await dio.get<dynamic>(_buildUrl(path), queryParameters: query);
      return _processResponse(response);
    } on DioException catch (e) {
      if (e.error is ApiException) {
        throw e.error!;
      }
      if (e.response != null) {
        try {
          return _processResponse(e.response!);
        } on ApiException {
          rethrow;
        } catch (_) {}
      }
      throw ApiException(
        e.message ?? 'Network Error',
        statusCode: e.response?.statusCode ?? 500,
        code: 'network',
      );
    }
  }

  Future<dynamic> post(String path, {Object? body}) async {
    try {
      final response = await dio.post<dynamic>(_buildUrl(path), data: body);
      return _processResponse(response);
    } on DioException catch (e) {
      if (e.error is ApiException) {
        throw e.error!;
      }
      if (e.response != null) {
        try {
          return _processResponse(e.response!);
        } on ApiException {
          rethrow;
        } catch (_) {}
      }
      throw ApiException(
        e.message ?? 'Network Error',
        statusCode: e.response?.statusCode ?? 500,
        code: 'network',
      );
    }
  }

  Future<dynamic> put(String path, {Object? body}) async {
    try {
      final response = await dio.put<dynamic>(_buildUrl(path), data: body);
      return _processResponse(response);
    } on DioException catch (e) {
      if (e.error is ApiException) {
        throw e.error!;
      }
      if (e.response != null) {
        try {
          return _processResponse(e.response!);
        } on ApiException {
          rethrow;
        } catch (_) {}
      }
      throw ApiException(
        e.message ?? 'Network Error',
        statusCode: e.response?.statusCode ?? 500,
        code: 'network',
      );
    }
  }

  Future<dynamic> delete(String path) async {
    try {
      final response = await dio.delete<dynamic>(_buildUrl(path));
      return _processResponse(response);
    } on DioException catch (e) {
      if (e.error is ApiException) {
        throw e.error!;
      }
      if (e.response != null) {
        try {
          return _processResponse(e.response!);
        } on ApiException {
          rethrow;
        } catch (_) {}
      }
      throw ApiException(
        e.message ?? 'Network Error',
        statusCode: e.response?.statusCode ?? 500,
        code: 'network',
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
    _refreshing = pending;
    final token = await pending;
    return token != null;
  }

  Future<String?> _doRefresh() async {
    if (_refreshToken == null) return null;
    try {
      final response = await dio.post<dynamic>(
        '/auth/refresh',
        data: <String, String>{'refreshToken': _refreshToken!},
      );
      final data = _processResponse(response) as Map<String, dynamic>;
      final token = (data['accessToken'] ?? data['token']) as String?;
      final nextRefresh = data['refreshToken'] as String?;
      if (token == null) return null;
      await setTokens(accessToken: token, refreshToken: nextRefresh);
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
