import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:parent_app/data/api/api_client.dart';
import 'package:parent_app/data/repositories/auth_repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});

  test('AuthRepository login success sets tokens and current user', () async {
    final client = MockClient((req) async {
      if (req.url.path.endsWith('/auth/login') && req.method == 'POST') {
        return http.Response(
          jsonEncode({
            'success': true,
            'data': {
              'token': 'test-access-token',
              'refreshToken': 'test-refresh-token',
              'user': {
                'id': 'u1',
                'name': 'Parent Name',
                'email': 'parent@school.local',
                'role': 'parent',
              }
            }
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
      return http.Response(jsonEncode({'success': false}), 400);
    });

    final api = ApiClient(httpClient: client);
    final repo = AuthRepository(api);

    final user = await repo.login(
      email: 'parent@school.local',
      password: 'password123',
    );

    expect(user.id, 'u1');
    expect(user.email, 'parent@school.local');
    expect(repo.currentUser?.id, 'u1');
    expect(api.token, 'test-access-token');
    expect(api.refreshToken, 'test-refresh-token');
  });

  test('AuthRepository login with empty email/password throws AuthException', () async {
    final client = MockClient((req) async => http.Response('', 400));
    final api = ApiClient(httpClient: client);
    final repo = AuthRepository(api);

    expect(
      () => repo.login(email: '', password: 'password'),
      throwsA(isA<AuthException>()),
    );
  });

  test('AuthRepository restoreSession uses existing token to fetch profile', () async {
    final client = MockClient((req) async {
      if (req.url.path.endsWith('/auth/me')) {
        return http.Response(
          jsonEncode({
            'success': true,
            'data': {
              'user': {
                'id': 'u1',
                'name': 'Parent Name',
                'email': 'parent@school.local',
                'role': 'parent',
              }
            }
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
      return http.Response(jsonEncode({'success': false}), 400);
    });

    final api = ApiClient(httpClient: client);
    await api.setTokens(accessToken: 'existing-token', refreshToken: 'existing-refresh');

    final repo = AuthRepository(api);
    final user = await repo.restoreSession();

    expect(user?.id, 'u1');
    expect(repo.currentUser?.id, 'u1');
  });

  test('AuthRepository logout clears local session and token', () async {
    final client = MockClient((req) async {
      if (req.url.path.endsWith('/auth/login') && req.method == 'POST') {
        return http.Response(
          jsonEncode({
            'success': true,
            'data': {
              'token': 'test-access-token',
              'refreshToken': 'test-refresh-token',
              'user': {
                'id': 'u1',
                'name': 'Parent Name',
                'email': 'parent@school.local',
                'role': 'parent',
              }
            }
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
      if (req.url.path.endsWith('/auth/logout')) {
        return http.Response(jsonEncode(<String, Object>{'success': true, 'data': <String, Object>{}}), 200);
      }
      return http.Response(jsonEncode({'success': false}), 400);
    });

    final api = ApiClient(httpClient: client);
    await api.setTokens(accessToken: 'existing-token', refreshToken: 'existing-refresh');

    final repo = AuthRepository(api);
    await repo.login(email: 'parent@school.local', password: 'password123'); // seed mock login user indirectly or set current user
    
    // Test logout
    await repo.logout();

    expect(repo.currentUser, isNull);
    expect(api.token, isNull);
    expect(api.refreshToken, isNull);
  });
}
