class Subject {
  final String id;
  final String name;
  final String code;
  final String? teacherName;

  const Subject({
    required this.id,
    required this.name,
    required this.code,
    this.teacherName,
  });

  factory Subject.fromJson(Map<String, dynamic> j) {
    return Subject(
      id: j['id'] as String,
      name: (j['name'] as String?) ?? '',
      code: (j['code'] as String?) ?? '',
    );
  }
}
