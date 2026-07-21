import '../models/user.dart';
import 'api_client.dart';

class AuthApi {
  AuthApi(this._client);
  final ApiClient _client;

  Future<({String token, String refreshToken, AppUser user})> login({
    required String email,
    required String password,
  }) async {
    final data = await _client.post('/auth/login', body: {
      'email': email,
      'password': password,
    }) as Map<String, dynamic>;
    final token = (data['accessToken'] ?? data['token']) as String;
    final refreshToken = data['refreshToken'] as String;
    final user = AppUser.fromJson(data['user'] as Map<String, dynamic>);
    await _client.setTokens(accessToken: token, refreshToken: refreshToken);
    return (token: token, refreshToken: refreshToken, user: user);
  }

  Future<AppUser> me() async {
    final data = await _client.get('/auth/me') as Map<String, dynamic>;
    return AppUser.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<void> logout() async {
    final refresh = _client.refreshToken;
    try {
      if (refresh != null) {
        await _client.post('/auth/logout', body: {'refreshToken': refresh});
      }
    } catch (_) {}
    await _client.clearTokens();
  }
}
