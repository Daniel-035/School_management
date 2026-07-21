import 'package:uuid/uuid.dart';

import '../api/api_client.dart';
import '../api/auth_api.dart';
import '../models/user.dart';

class AuthRepository {
  AuthRepository(this._api);
  final ApiClient _api;
  late final AuthApi _authApi = AuthApi(_api);

  AppUser? _current;
  AppUser? get currentUser => _current;

  Future<AppUser> login({required String email, required String password}) async {
    if (email.isEmpty || password.isEmpty) {
      throw const AuthException('Please enter email and password.');
    }
    final result = await _authApi.login(email: email, password: password);
    _current = result.user;
    return result.user;
  }

  Future<AppUser?> restoreSession() async {
    if (!_api.hasToken) return null;
    try {
      _current = await _authApi.me();
      return _current;
    } on ApiException {
      await _api.clearTokens();
      _current = null;
      return null;
    }
  }

  Future<void> logout() async {
    try {
      await _authApi.logout();
    } catch (_) {}
    _current = null;
  }

  String newId() => const Uuid().v4();
}

class AuthException implements Exception {
  final String message;
  const AuthException(this.message);
  @override
  String toString() => message;
}
