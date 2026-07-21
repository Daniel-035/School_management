import '../../core/utils/date_utils.dart';
import '../api/api_client.dart';
import '../models/academics.dart';
import '../models/homework.dart';
import '../models/subject.dart';

class HomeworkRepository {
  HomeworkRepository(this._api);
  final ApiClient _api;

  List<Subject> _subjects = [];
  Map<String, String> get _subjectMap => {for (final s in _subjects) s.id: s.name};

  Future<void> _ensureSubjects() async {
    if (_subjects.isEmpty) {
      final data = await _api.get('/students/subjects');
      if (data is List) {
        _subjects = data
            .whereType<Map<String, dynamic>>()
            .map(Subject.fromJson)
            .toList();
      }
    }
  }

  Future<List<Homework>> forClass(String classSectionId) async {
    await _ensureSubjects();
    final data = await _api.get(
      '/homework',
      query: {'classSectionId': classSectionId},
    );
    if (data is List) {
      return data
          .whereType<Map<String, dynamic>>()
          .map((j) => Homework.fromJson(
                j,
                resolveSubjectName: (id) => _subjectMap[id] ?? '',
              ))
          .toList()
        ..sort((a, b) => a.dueDate.compareTo(b.dueDate));
    }
    return [];
  }

  Future<List<Homework>> pendingForClass(String classSectionId) async {
    final today = DateTime.now().atMidnight;
    return (await forClass(classSectionId))
        .where((h) => h.dueDate.isAfter(today) || h.dueDate.sameDay(today))
        .toList();
  }

  Future<List<Homework>> overdueForClass(String classSectionId) async {
    final today = DateTime.now().atMidnight;
    return (await forClass(classSectionId))
        .where((h) => h.dueDate.isBefore(today))
        .toList();
  }
}

class ExamRepository {
  ExamRepository(this._api);
  final ApiClient _api;

  List<Subject> _subjects = [];
  Map<String, String> get _subjectMap => {for (final s in _subjects) s.id: s.name};

  Future<void> _ensureSubjects() async {
    if (_subjects.isEmpty) {
      final data = await _api.get('/students/subjects');
      if (data is List) {
        _subjects = data
            .whereType<Map<String, dynamic>>()
            .map(Subject.fromJson)
            .toList();
      }
    }
  }

  Future<List<ExamSchedule>> upcomingForClass(String classSectionId) async {
    await _ensureSubjects();
    final data = await _api.get(
      '/exams',
      query: {'classSectionId': classSectionId},
    );
    if (data is List) {
      return data
          .whereType<Map<String, dynamic>>()
          .map((j) => ExamSchedule.fromJson(
                j,
                resolveSubjectName: (id) => _subjectMap[id] ?? '',
              ))
          .toList()
        ..sort((a, b) => a.date.compareTo(b.date));
    }
    return [];
  }
}

class ReportCardRepository {
  ReportCardRepository(this._api);
  final ApiClient _api;

  Future<List<ReportCard>> forStudent(String studentId) async {
    try {
      final data = await _api.get('/exams/report/$studentId');
      if (data is List) {
        return data
            .whereType<Map<String, dynamic>>()
            .map(ReportCard.fromJson)
            .toList()
          ..sort((a, b) => b.issuedOn.compareTo(a.issuedOn));
      }
      if (data is Map<String, dynamic>) {
        return [ReportCard.fromJson(data)];
      }
    } catch (_) {
      return [];
    }
    return [];
  }
}
