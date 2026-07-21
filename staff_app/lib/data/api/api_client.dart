import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  final int statusCode;
  final String code;
  final String message;
  ApiException({required this.statusCode, required this.code, required this.message});
  @override
  String toString() => 'ApiException($statusCode, $code): $message';
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
    List<int> bodyBytes = [];
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
  final String baseUrl;
  final Connectivity _connectivity;
  final Dio dio;
  String? _token;
  String? _refreshToken;
  Future<String?>? _refreshing;
  final _expiredController = StreamController<void>.broadcast();

  static const String defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://school-management-74ecc.web.app/api',
  );
  static const String _tokenKey = 'staff_app.auth_token';
  static const String _refreshTokenKey = 'staff_app.refresh_token';
  static const _secure = FlutterSecureStorage();

  ApiClient({String? baseUrl, http.Client? httpClient, Connectivity? connectivity})
      : baseUrl = baseUrl ?? defaultBaseUrl,
        _connectivity = connectivity ?? Connectivity(),
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
        if (_token != null && _token!.isNotEmpty) {
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
            final code = err is Map ? (err['code']?.toString() ?? 'UNKNOWN') : 'UNKNOWN';
            final message = err is Map
                ? (err['message']?.toString() ?? 'Request failed')
                : (decoded['message']?.toString() ?? 'Request failed');
            return handler.reject(
              DioException(
                requestOptions: response.requestOptions,
                response: response,
                type: DioExceptionType.badResponse,
                error: ApiException(statusCode: response.statusCode ?? 500, code: code, message: message),
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
              final retryResponse = await dio.fetch(options);
              return handler.resolve(retryResponse);
            }
          } catch (refreshErr) {
            // failed to refresh
          }
          await setToken(null);
          _expiredController.add(null);
        }

        // If error response has data, parse it to raise structured ApiException
        if (err.response?.data is Map<String, dynamic>) {
          final decoded = err.response!.data as Map<String, dynamic>;
          final success = decoded['success'] == true;
          if (!success) {
            final errObj = decoded['error'];
            final code = errObj is Map ? (errObj['code']?.toString() ?? 'UNKNOWN') : 'UNKNOWN';
            final message = errObj is Map
                ? (errObj['message']?.toString() ?? 'Request failed')
                : (decoded['message']?.toString() ?? 'Request failed');
            return handler.next(
              DioException(
                requestOptions: err.requestOptions,
                response: err.response,
                type: err.type,
                error: ApiException(statusCode: status ?? 500, code: code, message: message),
              ),
            );
          }
        }

        return handler.next(err);
      },
    ));
  }

  String? get token => _token;
  String? get refreshToken => _refreshToken;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;
  Stream<void> get onSessionExpired => _expiredController.stream;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    try {
      _token = await _secure.read(key: _tokenKey) ?? prefs.getString(_tokenKey);
      _refreshToken = await _secure.read(key: _refreshTokenKey) ?? prefs.getString(_refreshTokenKey);
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

  dynamic _processResponse(Response response) {
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
        final code = err is Map ? (err['code']?.toString() ?? 'UNKNOWN') : 'UNKNOWN';
        final message = err is Map
            ? (err['message']?.toString() ?? 'Request failed')
            : (data['message']?.toString() ?? 'Request failed');
        throw ApiException(
          statusCode: response.statusCode ?? 500,
          code: code,
          message: message,
        );
      }
      return data['data'];
    }
    return data;
  }

  String _buildUrl(String path) {
    final cleanPath = path.startsWith('/') ? path : '/$path';
    final cleanBase = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    return '$cleanBase$cleanPath';
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
        statusCode: e.response?.statusCode ?? 500,
        code: 'NETWORK_ERROR',
        message: e.message ?? 'Network Error',
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
        statusCode: e.response?.statusCode ?? 500,
        code: 'NETWORK_ERROR',
        message: e.message ?? 'Network Error',
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
        statusCode: e.response?.statusCode ?? 500,
        code: 'NETWORK_ERROR',
        message: e.message ?? 'Network Error',
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
        statusCode: e.response?.statusCode ?? 500,
        code: 'NETWORK_ERROR',
        message: e.message ?? 'Network Error',
      );
    }
  }

  Future<dynamic> upload(String path,
      {required List<String> attachmentUris, Map<String, String> fields = const {}}) async {
    return {'attachments': attachmentUris, 'fields': fields};
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
      final response = await dio.post(
        '/auth/refresh',
        data: {'refreshToken': _refreshToken},
      );
      final data = response.data['data'];
      if (data is! Map<String, dynamic>) return null;
      final token = (data['accessToken'] ?? data['token'] ?? '').toString();
      final nextRefresh = (data['refreshToken'] ?? '').toString();
      if (token.isEmpty) return null;
      await setToken(token, refreshToken: nextRefresh.isEmpty ? null : nextRefresh);
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
