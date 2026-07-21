import 'class_section.dart';

class Student {
  final String id;
  final String name;
  final String rollNumber;
  final DateTime? dateOfBirth;
  final String? avatarUrl;
  final String classSectionId;
  final ClassSection classSection;
  final List<String> parentIds;
  final String status;

  const Student({
    required this.id,
    required this.name,
    required this.rollNumber,
    required this.classSectionId,
    required this.classSection,
    required this.parentIds,
    this.dateOfBirth,
    this.avatarUrl,
    this.status = 'active',
  });

  String get initials {
    final parts = name.trim().split(' ');
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts.last.substring(0, 1))
        .toUpperCase();
  }

  factory Student.fromJson(
    Map<String, dynamic> j, {
    ClassSection Function(String id)? resolveClass,
  }) {
    final id = j['id'] as String;
    final classSectionId = j['classSectionId'] as String? ?? '';
    final resolved = resolveClass?.call(classSectionId) ??
        ClassSection(id: classSectionId, grade: '', section: '', name: '');
    return Student(
      id: id,
      name: (j['name'] as String?) ?? '',
      rollNumber: (j['rollNumber'] as String?) ?? '',
      classSectionId: classSectionId,
      classSection: resolved,
      parentIds: (j['parentIds'] as List?)?.whereType<String>().toList() ??
          const [],
      status: (j['status'] as String?) ?? 'active',
    );
  }
}
