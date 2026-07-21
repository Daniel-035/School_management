import 'package:flutter/material.dart';

DateTime? _parseDate(dynamic value) {
  if (value == null) return null;
  final raw = value.toString();
  if (raw.isEmpty) return null;
  return DateTime.tryParse(raw);
}

enum AttendanceStatus { present, absent, late, halfDay }

extension AttendanceStatusX on AttendanceStatus {
  String get label {
    switch (this) {
      case AttendanceStatus.present:
        return 'Present';
      case AttendanceStatus.absent:
        return 'Absent';
      case AttendanceStatus.late:
        return 'Late';
      case AttendanceStatus.halfDay:
        return 'Half-day';
    }
  }

  Color get color {
    switch (this) {
      case AttendanceStatus.present:
        return const Color(0xFF2E7D32);
      case AttendanceStatus.absent:
        return const Color(0xFFC62828);
      case AttendanceStatus.late:
        return const Color(0xFFEF6C00);
      case AttendanceStatus.halfDay:
        return const Color(0xFF6A1B9A);
    }
  }

  String get apiValue {
    switch (this) {
      case AttendanceStatus.present:
        return 'present';
      case AttendanceStatus.absent:
        return 'absent';
      case AttendanceStatus.late:
      case AttendanceStatus.halfDay:
        return 'late';
    }
  }

  static AttendanceStatus fromApi(String? value) {
    switch (value) {
      case 'absent':
        return AttendanceStatus.absent;
      case 'late':
        return AttendanceStatus.late;
      case 'halfDay':
      case 'half-day':
        return AttendanceStatus.halfDay;
      case 'present':
      default:
        return AttendanceStatus.present;
    }
  }
}

class ClassSection {
  final String id;
  final String name;
  final String grade;
  final String section;
  final String? classTeacherId;
  final List<String> subjectIds;

  const ClassSection({
    required this.id,
    required this.name,
    this.grade = '',
    this.section = '',
    this.classTeacherId,
    this.subjectIds = const [],
  });

  String get label => name.isNotEmpty ? name : '$grade$section';

  factory ClassSection.fromJson(Map<String, dynamic> json) => ClassSection(
        id: (json['id'] ?? '').toString(),
        name: (json['name'] ?? json['classSectionName'] ?? '').toString(),
        grade: (json['grade'] ?? '').toString(),
        section: (json['section'] ?? '').toString(),
        classTeacherId: json['classTeacherId']?.toString(),
        subjectIds: json['subjectIds'] is List
            ? List<String>.from(
                (json['subjectIds'] as List).map((item) => item.toString()))
            : const [],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'grade': grade,
        'section': section,
        'classTeacherId': classTeacherId,
        'subjectIds': subjectIds
      };
}

class Student {
  final String id;
  final String name;
  final String rollNo;
  final String rollNumber;
  final String className;
  final String classSectionId;
  final List<String> parentIds;
  final DateTime? dateOfBirth;
  final String status;
  final ClassSection classSection;

  const Student({
    required this.id,
    required this.name,
    this.rollNo = '',
    this.rollNumber = '',
    this.className = '',
    this.classSectionId = '',
    this.parentIds = const [],
    this.dateOfBirth,
    this.status = 'active',
    this.classSection = const ClassSection(id: '', name: ''),
  });

  String get initials {
    final parts = name.trim().split(' ');
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts.last.substring(0, 1))
        .toUpperCase();
  }

  factory Student.fromJson(
    Map<String, dynamic> json, {
    ClassSection Function(String id)? resolveClass,
  }) {
    final id = (json['id'] ?? '').toString();
    final classSectionId = (json['classSectionId'] ?? '').toString();
    final rollNumber = (json['rollNumber'] ?? json['rollNo'] ?? '').toString();
    final resolvedClass = resolveClass?.call(classSectionId) ??
        ClassSection(
          id: classSectionId,
          name: (json['className'] ?? json['classSectionName'] ?? '').toString(),
        );
    return Student(
      id: id,
      name: (json['name'] ?? '').toString(),
      rollNo: rollNumber,
      rollNumber: rollNumber,
      className: resolvedClass.name,
      classSectionId: classSectionId,
      parentIds: json['parentIds'] is List
          ? List<String>.from(
              (json['parentIds'] as List).map((item) => item.toString()))
          : const [],
      dateOfBirth: _parseDate(json['dateOfBirth']),
      status: (json['status'] ?? 'active').toString(),
      classSection: resolvedClass,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'rollNumber': rollNumber,
        'rollNo': rollNo,
        'className': className,
        'classSectionId': classSectionId,
        'parentIds': parentIds,
        'dateOfBirth': dateOfBirth?.toIso8601String(),
        'status': status,
        'classSection': classSection.toJson(),
      };
}

class StaffMember {
  final String id;
  final String name;
  final String role;
  final String email;
  final String? phone;
  final String status;
  final String? firstName;
  final String? lastName;
  final String? username;
  final String? address;
  final String? dateOfBirth;
  final String? gender;
  final String? department;
  final List<String> subjectIds;
  final bool isClassTeacher;
  final String? classTeacherForId;
  final String? profilePicturePath;
  final String? avatarInitial;
  final List<String> assignedClassIds;
  final List<String> assignedSubjectIds;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const StaffMember(
      {required this.id,
      required this.name,
      required this.role,
      required this.email,
      this.phone,
      this.status = 'active',
      this.firstName,
      this.lastName,
      this.username,
      this.address,
      this.dateOfBirth,
      this.gender,
      this.department,
      this.subjectIds = const [],
      this.isClassTeacher = false,
      this.classTeacherForId,
      this.profilePicturePath,
      this.avatarInitial,
      this.assignedClassIds = const [],
      this.assignedSubjectIds = const [],
      this.createdAt,
      this.updatedAt});
}

class Subject {
  final String id;
  final String name;
  final String code;

  const Subject({required this.id, required this.name, required this.code});

  factory Subject.fromJson(Map<String, dynamic> json) => Subject(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      code: (json['code'] ?? '').toString());

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'code': code};
}

class ScheduleSlot {
  final String id;
  final String className;
  final String subject;
  final String startTime;
  final String endTime;
  final String room;
  final String day;

  const ScheduleSlot(
      {required this.id,
      required this.className,
      required this.subject,
      required this.startTime,
      required this.endTime,
      this.room = '',
      this.day = 'Mon'});
}

class Announcement {
  final String id;
  final String title;
  final String body;
  final DateTime postedAt;
  final String author;
  final List<String> audience;
  final List<String> channels;

  const Announcement(
      {required this.id,
      required this.title,
      required this.body,
      required this.postedAt,
      required this.author,
      this.audience = const [],
      this.channels = const []});

  factory Announcement.fromJson(Map<String, dynamic> json) => Announcement(
        id: (json['id'] ?? '').toString(),
        title: (json['title'] ?? '').toString(),
        body: (json['body'] ?? '').toString(),
        postedAt: _parseDate(
                json['publishedAt'] ?? json['postedAt'] ?? json['createdAt']) ??
            DateTime.now(),
        author: (json['authorName'] ?? json['author'] ?? 'School').toString(),
        audience: json['audience'] is List
            ? List<String>.from(
                (json['audience'] as List).map((item) => item.toString()))
            : const [],
        channels: json['channels'] is List
            ? List<String>.from(
                (json['channels'] as List).map((item) => item.toString()))
            : const [],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'publishedAt': postedAt.toIso8601String(),
        'authorName': author,
        'audience': audience,
        'channels': channels
      };
}

class Assignment {
  final String id;
  final String title;
  final String description;
  final String className;
  final String subject;
  final DateTime dueDate;
  final List<String> attachments;
  final int submitted;
  final int total;
  final String subjectId;
  final String classSectionId;

  const Assignment(
      {required this.id,
      required this.title,
      required this.description,
      required this.className,
      required this.subject,
      required this.dueDate,
      this.attachments = const [],
      this.submitted = 0,
      this.total = 0,
      this.subjectId = '',
      this.classSectionId = ''});

  factory Assignment.fromJson(Map<String, dynamic> json) => Assignment(
        id: (json['id'] ?? '').toString(),
        title: (json['title'] ?? '').toString(),
        description: (json['description'] ?? '').toString(),
        className:
            (json['className'] ?? json['classSectionName'] ?? '').toString(),
        subject: (json['subjectName'] ?? json['subject'] ?? '').toString(),
        subjectId: (json['subjectId'] ?? '').toString(),
        classSectionId: (json['classSectionId'] ?? '').toString(),
        dueDate: _parseDate(json['dueDate']) ?? DateTime.now(),
        attachments: json['attachments'] is List
            ? List<String>.from(
                (json['attachments'] as List).map((item) => item.toString()))
            : const [],
        submitted:
            json['submitted'] is num ? (json['submitted'] as num).toInt() : 0,
        total: json['total'] is num ? (json['total'] as num).toInt() : 0,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'className': className,
        'subject': subject,
        'dueDate': dueDate.toIso8601String(),
        'attachments': attachments,
        'submitted': submitted,
        'total': total,
        'subjectId': subjectId,
        'classSectionId': classSectionId
      };
}

class Exam {
  final String id;
  final String name;
  final String className;
  final String subject;
  final DateTime date;
  final int maxMarks;
  final String subjectId;
  final String classSectionId;
  final bool published;

  const Exam(
      {required this.id,
      required this.name,
      required this.className,
      required this.subject,
      required this.date,
      required this.maxMarks,
      this.subjectId = '',
      this.classSectionId = '',
      this.published = false});

  factory Exam.fromJson(Map<String, dynamic> json) => Exam(
        id: (json['id'] ?? '').toString(),
        name: (json['title'] ?? json['name'] ?? '').toString(),
        className:
            (json['className'] ?? json['classSectionName'] ?? '').toString(),
        subject: (json['subjectName'] ?? json['subject'] ?? '').toString(),
        subjectId: (json['subjectId'] ?? '').toString(),
        classSectionId: (json['classSectionId'] ?? '').toString(),
        date: _parseDate(json['date']) ?? DateTime.now(),
        maxMarks:
            json['maxMarks'] is num ? (json['maxMarks'] as num).toInt() : 0,
        published: json['published'] == true,
      );
}

class GradeEntry {
  final String studentId;
  final double marks;
  final bool published;

  const GradeEntry(
      {required this.studentId, required this.marks, this.published = false});
}

class NoticeboardPost {
  final String id;
  final String title;
  final String body;
  final String className;
  final DateTime postedAt;
  final String author;
  final List<String> attachments;

  const NoticeboardPost(
      {required this.id,
      required this.title,
      required this.body,
      required this.className,
      required this.postedAt,
      required this.author,
      this.attachments = const []});

  factory NoticeboardPost.fromJson(Map<String, dynamic> json) =>
      NoticeboardPost(
        id: (json['id'] ?? '').toString(),
        title: (json['title'] ?? '').toString(),
        body: (json['body'] ?? '').toString(),
        className:
            (json['className'] ?? json['classSectionName'] ?? '').toString(),
        postedAt: _parseDate(
                json['publishedAt'] ?? json['postedAt'] ?? json['createdAt']) ??
            DateTime.now(),
        author: (json['authorName'] ?? json['author'] ?? 'School').toString(),
        attachments: json['attachments'] is List
            ? List<String>.from(
                (json['attachments'] as List).map((item) => item.toString()))
            : const [],
      );
}

class DirectMessage {
  final String id;
  final String parentName;
  final String studentName;
  final String preview;
  final DateTime sentAt;
  final bool moderated;
  final String status;
  final String threadId;
  final int unreadCount;
  final List<String> attachments;

  const DirectMessage(
      {required this.id,
      required this.parentName,
      required this.studentName,
      required this.preview,
      required this.sentAt,
      this.moderated = true,
      this.status = 'Approved',
      this.threadId = '',
      this.unreadCount = 0,
      this.attachments = const []});

  factory DirectMessage.fromThreadJson(Map<String, dynamic> json) =>
      DirectMessage(
        id: (json['id'] ?? '').toString(),
        threadId: (json['id'] ?? '').toString(),
        parentName:
            (json['parentName'] ?? json['parentId'] ?? 'Parent').toString(),
        studentName:
            (json['studentName'] ?? json['studentId'] ?? 'Student').toString(),
        preview: (json['lastMessagePreview'] ?? '').toString(),
        sentAt: _parseDate(json['lastMessageAt'] ??
                json['updatedAt'] ??
                json['createdAt']) ??
            DateTime.now(),
        status: 'Delivered',
        unreadCount: json['unreadCount'] is num
            ? (json['unreadCount'] as num).toInt()
            : 0,
      );
}

class ChatMessage {
  final String id;
  final String threadId;
  final String senderId;
  final String text;
  final DateTime sentAt;
  final bool read;
  final List<String> attachments;

  const ChatMessage(
      {required this.id,
      required this.threadId,
      required this.senderId,
      required this.text,
      required this.sentAt,
      this.read = false,
      this.attachments = const []});

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: (json['id'] ?? '').toString(),
        threadId: (json['threadId'] ?? '').toString(),
        senderId: (json['senderId'] ?? '').toString(),
        text: (json['text'] ?? '').toString(),
        sentAt:
            _parseDate(json['sentAt'] ?? json['createdAt']) ?? DateTime.now(),
        read: json['read'] == true,
        attachments: json['attachments'] is List
            ? List<String>.from(
                (json['attachments'] as List).map((item) => item.toString()))
            : const [],
      );
}

class AttendanceRecord {
  final String id;
  final String studentId;
  final String classSectionId;
  final DateTime date;
  final AttendanceStatus status;

  const AttendanceRecord(
      {required this.id,
      required this.studentId,
      required this.classSectionId,
      required this.date,
      required this.status});

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) =>
      AttendanceRecord(
        id: (json['id'] ?? '').toString(),
        studentId: (json['studentId'] ?? '').toString(),
        classSectionId: (json['classSectionId'] ?? '').toString(),
        date: _parseDate(json['date']) ?? DateTime.now(),
        status: AttendanceStatusX.fromApi(json['status']?.toString()),
      );
}
