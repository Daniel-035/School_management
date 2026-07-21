enum AttendanceStatus { present, absent, late, onLeave }

AttendanceStatus _attendanceFromString(String? s) {
  switch (s) {
    case 'present':
      return AttendanceStatus.present;
    case 'absent':
      return AttendanceStatus.absent;
    case 'late':
      return AttendanceStatus.late;
    case 'leave':
    case 'on_leave':
    case 'onLeave':
      return AttendanceStatus.onLeave;
    default:
      return AttendanceStatus.present;
  }
}

class AttendanceRecord {
  final String id;
  final String studentId;
  final String classSectionId;
  final DateTime date;
  final AttendanceStatus status;
  final String? remarks;
  final String? markedBy;

  const AttendanceRecord({
    required this.id,
    required this.studentId,
    required this.date,
    required this.status,
    this.classSectionId = '',
    this.remarks,
    this.markedBy,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> j) {
    return AttendanceRecord(
      id: j['id'] as String,
      studentId: j['studentId'] as String,
      classSectionId: (j['classSectionId'] as String?) ?? '',
      date: DateTime.parse(j['date'] as String),
      status: _attendanceFromString(j['status'] as String?),
      markedBy: j['markedBy'] as String?,
    );
  }
}

enum LeaveStatus { pending, approved, rejected }

LeaveStatus _leaveFromString(String? s) {
  switch (s) {
    case 'approved':
      return LeaveStatus.approved;
    case 'rejected':
      return LeaveStatus.rejected;
    case 'pending':
    default:
      return LeaveStatus.pending;
  }
}

class LeaveRequest {
  final String id;
  final String studentId;
  final String parentId;
  final DateTime fromDate;
  final DateTime toDate;
  final String reason;
  final LeaveStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? reviewedBy;
  final String? reviewNote;

  const LeaveRequest({
    required this.id,
    required this.studentId,
    required this.fromDate,
    required this.toDate,
    required this.reason,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.parentId = '',
    this.reviewedBy,
    this.reviewNote,
  });

  DateTime get appliedAt => createdAt;

  int get dayCount {
    final days = toDate.difference(fromDate).inDays + 1;
    return days < 1 ? 1 : days;
  }

  factory LeaveRequest.fromJson(Map<String, dynamic> j) {
    return LeaveRequest(
      id: j['id'] as String,
      studentId: j['studentId'] as String,
      parentId: (j['parentId'] as String?) ?? '',
      fromDate: DateTime.parse(j['fromDate'] as String),
      toDate: DateTime.parse(j['toDate'] as String),
      reason: (j['reason'] as String?) ?? '',
      status: _leaveFromString(j['status'] as String?),
      createdAt: DateTime.tryParse(j['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      updatedAt: DateTime.tryParse(j['updatedAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}
