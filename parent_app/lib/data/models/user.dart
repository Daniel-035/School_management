enum UserRole { parent, teacher, admin, staff, student }

UserRole _roleFromString(String s) {
  switch (s) {
    case 'admin':
      return UserRole.admin;
    case 'staff':
      return UserRole.staff;
    case 'teacher':
      return UserRole.teacher;
    case 'student':
      return UserRole.student;
    case 'parent':
    default:
      return UserRole.parent;
  }
}

String _roleToString(UserRole r) {
  switch (r) {
    case UserRole.admin:
      return 'admin';
    case UserRole.staff:
      return 'staff';
    case UserRole.teacher:
      return 'teacher';
    case UserRole.student:
      return 'student';
    case UserRole.parent:
      return 'parent';
  }
}

class AppUser {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? avatarUrl;
  final UserRole role;
  final String status;
  final String? firstName;
  final String? lastName;
  final String? username;
  final String? address;
  final String? dateOfBirth;
  final String? gender;
  final DateTime createdAt;
  final DateTime updatedAt;

  AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.avatarUrl,
    this.status = 'active',
    this.firstName,
    this.lastName,
    this.username,
    this.address,
    this.dateOfBirth,
    this.gender,
    DateTime? createdAt,
    DateTime? updatedAt,
  })  : createdAt = createdAt ?? _epoch,
        updatedAt = updatedAt ?? _epoch;

  static final DateTime _epoch = DateTime.fromMillisecondsSinceEpoch(0);

  static final AppUser empty = AppUser(
    id: '',
    name: '',
    email: '',
    role: UserRole.parent,
  );

  factory AppUser.fromJson(Map<String, dynamic> j) {
    return AppUser(
      id: j['id'] as String,
      name: (j['name'] as String?) ?? '',
      email: (j['email'] as String?) ?? '',
      role: _roleFromString((j['role'] as String?) ?? 'parent'),
      status: (j['status'] as String?) ?? 'active',
      phone: j['phone'] as String?,
      avatarUrl: j['profilePicturePath'] as String?,
      firstName: j['firstName'] as String?,
      lastName: j['lastName'] as String?,
      username: j['username'] as String?,
      address: j['address'] as String?,
      dateOfBirth: j['dateOfBirth'] as String?,
      gender: j['gender'] as String?,
      createdAt: _parseDate(j['createdAt']),
      updatedAt: _parseDate(j['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': _roleToString(role),
        'status': status,
        'firstName': firstName,
        'lastName': lastName,
        'username': username,
        'phone': phone,
        'address': address,
        'dateOfBirth': dateOfBirth,
        'gender': gender,
        'profilePicturePath': avatarUrl,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };
}

DateTime _parseDate(Object? v) {
  if (v is String && v.isNotEmpty) {
    return DateTime.tryParse(v) ?? DateTime.fromMillisecondsSinceEpoch(0);
  }
  return DateTime.fromMillisecondsSinceEpoch(0);
}
