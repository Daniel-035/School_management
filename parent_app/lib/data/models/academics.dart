class ExamSchedule {
  final String id;
  final String examName;
  final String title;
  final String subjectId;
  final String subjectName;
  final DateTime date;
  final String startTime;
  final String endTime;
  final String room;
  final double maxMarks;
  final String classSectionId;

  const ExamSchedule({
    required this.id,
    required this.date,
    required this.classSectionId,
    this.examName = '',
    this.title = '',
    this.subjectId = '',
    this.subjectName = '',
    this.startTime = '',
    this.endTime = '',
    this.room = '',
    this.maxMarks = 0,
  });

  factory ExamSchedule.fromJson(
    Map<String, dynamic> j, {
    String Function(String id)? resolveSubjectName,
  }) {
    final subjectId = (j['subjectId'] as String?) ?? '';
    final title = (j['title'] as String?) ?? '';
    return ExamSchedule(
      id: j['id'] as String,
      examName: title,
      title: title,
      subjectId: subjectId,
      subjectName: resolveSubjectName?.call(subjectId) ?? '',
      date: DateTime.parse(j['date'] as String),
      maxMarks: ((j['maxMarks'] as num?) ?? 0).toDouble(),
      classSectionId: (j['classSectionId'] as String?) ?? '',
    );
  }
}

class SubjectGrade {
  final String subjectName;
  final double marksObtained;
  final double maxMarks;
  final String grade;

  const SubjectGrade({
    required this.subjectName,
    required this.marksObtained,
    required this.maxMarks,
    required this.grade,
  });

  double get percent => maxMarks == 0 ? 0 : (marksObtained / maxMarks) * 100;

  factory SubjectGrade.fromJson(Map<String, dynamic> j) {
    final max = ((j['maxMarks'] as num?) ?? 0).toDouble();
    final marks = ((j['marks'] as num?) ?? 0).toDouble();
    return SubjectGrade(
      subjectName: (j['subjectName'] as String?) ??
          ((j['subjectId'] as String?) ?? ''),
      marksObtained: marks,
      maxMarks: max,
      grade: _letterGrade(max == 0 ? 0 : (marks / max) * 100),
    );
  }
}

class ReportCard {
  final String id;
  final String studentId;
  final String term;
  final DateTime issuedOn;
  final double attendancePercent;
  final String? classTeacherRemark;
  final List<SubjectGrade> grades;

  const ReportCard({
    required this.id,
    required this.studentId,
    required this.term,
    required this.issuedOn,
    required this.attendancePercent,
    required this.grades,
    this.classTeacherRemark,
  });

  double get overallPercent {
    if (grades.isEmpty) return 0;
    final total = grades.fold<double>(0, (s, g) => s + g.percent);
    return total / grades.length;
  }

  factory ReportCard.fromJson(Map<String, dynamic> j) {
    final gradesList = (j['grades'] as List?)
            ?.whereType<Map<String, dynamic>>()
            .map(SubjectGrade.fromJson)
            .toList() ??
        const <SubjectGrade>[];
    return ReportCard(
      id: (j['id'] as String?) ?? '',
      studentId: (j['studentId'] as String?) ?? '',
      term: (j['term'] as String?) ?? '',
      issuedOn: DateTime.tryParse(j['issuedOn']?.toString() ?? '') ??
          DateTime.now(),
      attendancePercent: ((j['attendancePercent'] as num?) ?? 0).toDouble(),
      classTeacherRemark: j['classTeacherRemark'] as String?,
      grades: gradesList,
    );
  }
}

String _letterGrade(double pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  return 'D';
}
