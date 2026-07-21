class ClassSection {
  final String id;
  final String grade;
  final String section;
  final String name;
  final String? classTeacherId;
  final List<String> subjectIds;

  const ClassSection({
    required this.id,
    required this.grade,
    required this.section,
    this.name = '',
    this.classTeacherId,
    this.subjectIds = const [],
  });

  String get label {
    if (name.isNotEmpty) return name;
    return 'Grade $grade · $section';
  }

  factory ClassSection.fromJson(Map<String, dynamic> j) {
    return ClassSection(
      id: j['id'] as String,
      grade: (j['grade'] as String?) ?? '',
      section: (j['section'] as String?) ?? '',
      name: (j['name'] as String?) ?? '',
      classTeacherId: j['classTeacherId'] as String?,
      subjectIds: (j['subjectIds'] as List?)
              ?.whereType<String>()
              .toList() ??
          const [],
    );
  }
}
