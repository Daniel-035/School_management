import '../../core/utils/date_utils.dart';
import '../api/api_client.dart';
import '../models/attendance.dart';

class AttendanceSummary {
  final int present;
  final int absent;
  final int late;
  final int total;
  final AttendanceRecord? latest;
  const AttendanceSummary({
    required this.present,
    required this.absent,
    required this.late,
    required this.total,
    this.latest,
  });

  double get percentPresent => total == 0 ? 0 : (present / total) * 100;
}

class AttendanceRepository {
  AttendanceRepository(this._api);
  final ApiClient _api;

  List<AttendanceRecord> _filterMonth(
    List<AttendanceRecord> all,
    DateTime? month,
  ) {
    if (month == null) return all;
    return all
        .where((r) => r.date.year == month.year && r.date.month == month.month)
        .toList();
  }

  Future<List<AttendanceRecord>> forStudent(
    String studentId, {
    DateTime? month,
  }) async {
    final data = await _api.get('/attendance/student/$studentId');
    final list = (data is List)
        ? data
            .whereType<Map<String, dynamic>>()
            .map(AttendanceRecord.fromJson)
            .toList()
        : <AttendanceRecord>[];
    list.sort((a, b) => b.date.compareTo(a.date));
    return _filterMonth(list, month);
  }

  Future<AttendanceSummary> summary(String studentId) async {
    final data = await _api.get(
      '/attendance/summary/$studentId',
      query: {
        'month': DateTime.now().toIso8601String().substring(0, 7),
      },
    );
    if (data is Map<String, dynamic>) {
      final present = ((data['present'] as num?) ?? 0).toInt();
      final absent = ((data['absent'] as num?) ?? 0).toInt();
      final late = ((data['late'] as num?) ?? 0).toInt();
      final total = ((data['total'] as num?) ?? 0).toInt();
      return AttendanceSummary(
        present: present,
        absent: absent,
        late: late,
        total: total,
        latest: null,
      );
    }
    final records = await forStudent(studentId);
    final present =
        records.where((r) => r.status == AttendanceStatus.present).length;
    final absent =
        records.where((r) => r.status == AttendanceStatus.absent).length;
    final late = records.where((r) => r.status == AttendanceStatus.late).length;
    return AttendanceSummary(
      present: present,
      absent: absent,
      late: late,
      total: records.length,
      latest: records.isEmpty ? null : records.first,
    );
  }

  Future<LeaveRequest> applyLeave({
    required String studentId,
    required String parentId,
    required DateTime from,
    required DateTime to,
    required String reason,
  }) async {
    if (to.isBefore(from)) {
      throw ArgumentError('End date must be on or after start date.');
    }
    if (reason.trim().length < 5) {
      throw ArgumentError('Reason must be at least 5 characters.');
    }
    final data = await _api.post('/attendance/leave', body: {
      'studentId': studentId,
      'parentId': parentId,
      'fromDate': from.atMidnight.toIso8601String().substring(0, 10),
      'toDate': to.atMidnight.toIso8601String().substring(0, 10),
      'reason': reason.trim(),
    });
    if (data is Map<String, dynamic> && data['request'] is Map<String, dynamic>) {
      return LeaveRequest.fromJson(data['request'] as Map<String, dynamic>);
    }
    if (data is Map<String, dynamic>) {
      return LeaveRequest.fromJson(data);
    }
    throw const ApiException('Invalid leave response', code: 'invalid_response');
  }

  Future<List<LeaveRequest>> leaveHistory(String studentId) async {
    final data = await _api.get(
      '/attendance/leave',
      query: {'studentId': studentId},
    );
    if (data is List) {
      return data
          .whereType<Map<String, dynamic>>()
          .map(LeaveRequest.fromJson)
          .toList()
        ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    }
    return [];
  }
}
