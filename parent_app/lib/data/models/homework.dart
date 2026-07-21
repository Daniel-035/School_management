class Homework {
  final String id;
  final String title;
  final String description;
  final String subjectId;
  final String subjectName;
  final String classSectionId;
  final DateTime dueDate;
  final List<String> attachments;
  final String? teacherName;
  final String? createdBy;
  final DateTime? assignedOn;

  const Homework({
    required this.id,
    required this.title,
    required this.description,
    required this.classSectionId,
    required this.dueDate,
    this.subjectId = '',
    this.subjectName = '',
    this.attachments = const [],
    this.teacherName,
    this.createdBy,
    this.assignedOn,
  });

  factory Homework.fromJson(
    Map<String, dynamic> j, {
    String Function(String id)? resolveSubjectName,
  }) {
    final subjectId = (j['subjectId'] as String?) ?? '';
    return Homework(
      id: j['id'] as String,
      title: (j['title'] as String?) ?? '',
      description: (j['description'] as String?) ?? '',
      subjectId: subjectId,
      subjectName: resolveSubjectName?.call(subjectId) ?? '',
      classSectionId: (j['classSectionId'] as String?) ?? '',
      dueDate: DateTime.parse(j['dueDate'] as String),
      attachments: (j['attachments'] as List?)?.whereType<String>().toList() ??
          const [],
      createdBy: j['createdBy'] as String?,
    );
  }
}
