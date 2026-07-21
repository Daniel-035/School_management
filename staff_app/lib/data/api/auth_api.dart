import 'api_client.dart';

class AuthUser {
  final String id;
  final String name;
  final String email;
  final String role;
  final String status;
  final String? phone;
  final String? firstName;
  final String? lastName;
  final String? username;
  final String? address;
  final String? dateOfBirth;
  final String? gender;
  final String? department;
  final List<String> subjectIds;
  final bool isClassTeacher;
  final String? classTeacherForId;
  final String? profilePicturePath;
  final String? avatarInitial;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const AuthUser(
      {required this.id,
      required this.name,
      required this.email,
      required this.role,
      required this.status,
      this.phone,
      this.firstName,
      this.lastName,
      this.username,
      this.address,
      this.dateOfBirth,
      this.gender,
      this.department,
      this.subjectIds = const [],
      this.isClassTeacher = false,
      this.classTeacherForId,
      this.profilePicturePath,
      this.avatarInitial,
      this.createdAt,
      this.updatedAt});

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final name = (json['name'] ?? '').toString();
    return AuthUser(
      id: (json['id'] ?? '').toString(),
      name: name,
      email: (json['email'] ?? '').toString(),
      role: (json['role'] ?? '').toString(),
      status: (json['status'] ?? 'active').toString(),
      phone: (json['phone'] ?? '').toString().isEmpty ? null : json['phone'].toString(),
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      username: json['username'] as String?,
      address: json['address'] as String?,
      dateOfBirth: json['dateOfBirth'] as String?,
      gender: json['gender'] as String?,
      department: json['department'] as String?,
      subjectIds: (json['subjectIds'] as List<dynamic>?)?.cast<String>() ?? const [],
      isClassTeacher: json['isClassTeacher'] == true,
      classTeacherForId: json['classTeacherForId'] as String?,
      profilePicturePath: json['profilePicturePath'] as String?,
      avatarInitial: name.isNotEmpty ? name[0].toUpperCase() : null,
      createdAt: _tryParseDate(json['createdAt']),
      updatedAt: _tryParseDate(json['updatedAt']),
    );
  }
}

DateTime? _tryParseDate(dynamic value) {
  if (value == null) return null;
  final raw = value.toString();
  if (raw.isEmpty) return null;
  return DateTime.tryParse(raw);
}

class AuthResult {
  final String token;
  final String? refreshToken;
  final AuthUser user;
  const AuthResult(
      {required this.token, required this.user, this.refreshToken});
}

class AuthApi {
  AuthApi(this._client);
  final ApiClient _client;

  Future<AuthResult> login(String email, String password) async {
    final data = await _client
        .post('/auth/login', body: {'email': email, 'password': password});
    if (data is! Map<String, dynamic>) {
      throw ApiException(
          statusCode: 500,
          code: 'BAD_RESPONSE',
          message: 'Invalid login response');
    }
    final token = (data['accessToken'] ?? data['token'] ?? '').toString();
    final refreshToken = (data['refreshToken'] ?? '').toString();
    final userJson = data['user'];
    if (token.isEmpty || userJson is! Map<String, dynamic>) {
      throw ApiException(
          statusCode: 500,
          code: 'BAD_RESPONSE',
          message: 'Missing token or user in response');
    }
    await _client.setToken(token,
        refreshToken: refreshToken.isEmpty ? null : refreshToken);
    return AuthResult(
        token: token,
        refreshToken: refreshToken.isEmpty ? null : refreshToken,
        user: AuthUser.fromJson(userJson));
  }

  Future<AuthUser> me() async {
    final data = await _client.get('/auth/me');
    if (data is Map<String, dynamic> && data['user'] is Map<String, dynamic>) {
      return AuthUser.fromJson(data['user'] as Map<String, dynamic>);
    }
    if (data is Map<String, dynamic>) return AuthUser.fromJson(data);
    throw ApiException(
        statusCode: 500, code: 'BAD_RESPONSE', message: 'Invalid me response');
  }

  Future<bool> refresh() async {
    final refreshToken = _client.refreshToken;
    if (refreshToken == null || refreshToken.isEmpty) return false;
    final data = await _client
        .post('/auth/refresh', body: {'refreshToken': refreshToken});
    if (data is! Map<String, dynamic>) return false;
    final token = (data['accessToken'] ?? data['token'] ?? '').toString();
    final nextRefreshToken = (data['refreshToken'] ?? '').toString();
    if (token.isEmpty) return false;
    await _client.setToken(token,
        refreshToken:
            nextRefreshToken.isEmpty ? refreshToken : nextRefreshToken);
    return true;
  }

  Future<void> logout() async {
    final refreshToken = _client.refreshToken;
    try {
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await _client
            .post('/auth/logout', body: {'refreshToken': refreshToken});
      }
    } catch (_) {}
    await _client.setToken(null);
  }
}
