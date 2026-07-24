import '../api/api_client.dart';
import '../models/class_section.dart';
import '../models/student.dart';

class StudentRepository {
  StudentRepository(this._api);
  final ApiClient _api;

  List<ClassSection> _cachedClasses = [];
  Map<String, ClassSection> get _classMap => {
    for (final c in _cachedClasses) c.id: c,
  };

  Future<void> _ensureClasses() async {
    if (_cachedClasses.isEmpty) {
      final data = await _api.get('/students/classes');
      if (data is List) {
        _cachedClasses = data
            .whereType<Map<String, dynamic>>()
            .map(ClassSection.fromJson)
            .toList();
      }
    }
  }

  ClassSection _resolveClass(String id) {
    return _classMap[id] ??
        ClassSection(id: id, grade: '', section: '', name: '');
  }

  Future<List<Student>> childrenOf(String parentId) async {
    await _ensureClasses();
    final data = await _api.get('/students', query: {'parentId': parentId});
    if (data is List) {
      final list = data
          .whereType<Map<String, dynamic>>()
          .map((j) => Student.fromJson(j, resolveClass: _resolveClass))
          .toList();
      if (list.isNotEmpty) return list;
    }
    final direct = await byId(parentId);
    if (direct != null) return [direct];
    return [];
  }

  Future<Student?> byId(String id) async {
    await _ensureClasses();
    final data = await _api.get('/students/$id');
    if (data is Map<String, dynamic>) {
      return Student.fromJson(data, resolveClass: _resolveClass);
    }
    return null;
  }
}
