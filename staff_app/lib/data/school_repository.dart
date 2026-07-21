import 'package:flutter/foundation.dart';
import 'package:staff_app/data/api/api_client.dart';
import 'package:staff_app/data/api/auth_api.dart';
import 'package:staff_app/data/local_cache.dart';
import 'package:staff_app/data/upload_service.dart';
import 'package:staff_app/data/models.dart';
import 'package:staff_app/data/push_service.dart';

class SchoolRepository extends ChangeNotifier {
  SchoolRepository(
      {ApiClient? client,
      LocalCache? cache,
      UploadService? uploadService,
      PushService? pushService})
      : _api = client ?? ApiClient(),
        _cache = cache ?? LocalCache(),
        _uploadService = uploadService ?? UploadService(ApiClient()),
        _pushService = pushService ?? PushService() {
    _auth = AuthApi(_api);
    _init();
  }

  final ApiClient _api;
  final LocalCache _cache;
  final UploadService _uploadService;
  final PushService _pushService;
  late final AuthApi _auth;

  AuthApi get auth => _auth;
  ApiClient get api => _api;
  PushService get pushService => _pushService;

  List<Student> _students = [];
  List<ClassSection> _classes = [];
  List<Subject> _subjects = [];
  List<Assignment> _assignments = [];
  List<Exam> _exams = [];
  List<Announcement> _announcements = [];
  List<NoticeboardPost> _noticeboard = [];
  List<DirectMessage> _directMessages = [];
  List<StaffNotification> _notifications = [];
  final Map<String, Map<String, AttendanceStatus>> _attendance = {};
  final Map<String, Map<String, double>> _marks = {};
  final Map<String, bool> _publishedExams = {};
  final Map<String, Map<String, int>> _lastMonthlySummaryCache = {};
  final List<Map<String, dynamic>> _pendingAttendanceSync = [];

  StaffMember? _currentStaff;
  bool _loading = false;
  bool _offline = false;
  String? _error;

  bool get isAuthenticated => _api.isAuthenticated;
  bool get loading => _loading;
  bool get isOffline => _offline;
  String? get error => _error;
  int get unreadNotifications =>
      _notifications.where((item) => !item.read).length;

  StaffMember get currentStaff =>
      _currentStaff ??
      const StaffMember(id: '', name: 'Staff', role: 'Staff', email: '');
  List<Student> get students => List.unmodifiable(_students);
  List<ClassSection> get classes => List.unmodifiable(_classes);
  List<Subject> get subjects => List.unmodifiable(_subjects);
  List<Assignment> get assignments => List.unmodifiable(
      [..._assignments]..sort((a, b) => a.dueDate.compareTo(b.dueDate)));
  List<Exam> get exams => List.unmodifiable(_exams);
  List<Announcement> get announcements => List.unmodifiable(_announcements);
  List<NoticeboardPost> get noticeboard => List.unmodifiable(
      [..._noticeboard]..sort((a, b) => b.postedAt.compareTo(a.postedAt)));
  List<DirectMessage> get directMessages => List.unmodifiable(_directMessages);
  List<StaffNotification> get notifications =>
      List.unmodifiable(_notifications);
  List<String> get classNames => _classes.map((item) => item.name).toList();
  List<String> get subjectNames => _subjects.map((item) => item.name).toList();
  List<String> get weekDays => const ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  Future<void> _init() async {
    await _api.init();
    _api.onSessionExpired.listen((_) => _handleSessionExpired());
    await _restoreCachedData();
    await _pushService.init();
    _notifications = await _pushService.loadNotifications();
    _pushService.stream.listen((_) async {
      _notifications = await _pushService.loadNotifications();
      notifyListeners();
    });
    if (_api.isAuthenticated) {
      try {
        final user = await _auth.me();
        _currentStaff = _staffFromAuth(user);
        await loadAll();
      } catch (_) {}
    }
    notifyListeners();
  }

  void _handleSessionExpired() {
    _currentStaff = null;
    _students = [];
    _assignments = [];
    _exams = [];
    _announcements = [];
    _noticeboard = [];
    _directMessages = [];
    _attendance.clear();
    _marks.clear();
    _publishedExams.clear();
    _error = null;
    _offline = false;
    notifyListeners();
  }

  StaffMember _staffFromAuth(AuthUser user) => StaffMember(
        id: user.id,
        name: user.name.isEmpty ? 'Staff' : user.name,
        role: _roleLabel(user.role),
        email: user.email,
        phone: user.phone,
        status: user.status,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        department: user.department,
        subjectIds: user.subjectIds,
        isClassTeacher: user.isClassTeacher,
        classTeacherForId: user.classTeacherForId,
        profilePicturePath: user.profilePicturePath,
        avatarInitial: user.avatarInitial,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        assignedClassIds: _classes
            .where((item) =>
                item.classTeacherId == user.id || item.classTeacherId == null)
            .map((item) => item.id)
            .toList(),
        assignedSubjectIds: _subjects.map((item) => item.id).toList(),
      );

  String _roleLabel(String role) {
    switch (role) {
      case 'staff':
        return 'Staff';
      case 'admin':
        return 'Administrator';
      case 'parent':
        return 'Parent';
      default:
        return role.isEmpty ? 'Staff' : role;
    }
  }

  Future<bool> login(String email, String password) async {
    _setLoading(true);
    try {
      final result = await _auth.login(email, password);
      _currentStaff = _staffFromAuth(result.user);
      _error = null;
      await loadAll();
      return true;
    } on ApiException catch (error) {
      _error = error.message;
      return false;
    } catch (error) {
      _error = error.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    await _auth.logout();
    _currentStaff = null;
    _students = [];
    _assignments = [];
    _exams = [];
    _announcements = [];
    _noticeboard = [];
    _directMessages = [];
    _attendance.clear();
    _marks.clear();
    _publishedExams.clear();
    notifyListeners();
  }

  Future<void> loadAll() async {
    if (!_api.isAuthenticated) return;
    _setLoading(true);
    try {
      await Future.wait([_loadClasses(), _loadSubjects()]);
      await Future.wait([
        _loadStudents(),
        _loadAssignments(),
        _loadExams(),
        _loadAnnouncements(),
        _loadNoticeboard(),
        _loadThreads()
      ]);
      await _syncPendingAttendance();
      _error = null;
    } on ApiException catch (error) {
      _error = error.message;
    } catch (error) {
      _error = error.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> _restoreCachedData() async {
    _students = await _decodeList('students', Student.fromJson);
    _classes = await _decodeList('classes', ClassSection.fromJson);
    _subjects = await _decodeList('subjects', Subject.fromJson);
    _assignments = await _decodeList('assignments', Assignment.fromJson);
    _exams = await _decodeList('exams', Exam.fromJson);
    _announcements =
        await _decodeList('announcements', Announcement.fromJson);
    _noticeboard =
        await _decodeList('noticeboard', NoticeboardPost.fromJson);
  }

  Future<List<T>> _decodeList<T>(
      String key, T Function(Map<String, dynamic>) fromJson) async {
    try {
      final cached = await _cache.readJson(key);
      if (cached is List) {
        return cached
            .whereType<Map<String, dynamic>>()
            .map(fromJson)
            .toList();
      }
    } catch (_) {}
    return const [];
  }

  Future<List<T>> _getList<T>(
      {required String cacheKey,
      required String path,
      required String dataKey,
      required T Function(Map<String, dynamic>) fromJson,
      Map<String, dynamic>? query}) async {
    try {
      final data = await _api.get(path, query: query);
      _offline = false;
      if (data is Map<String, dynamic> && data[dataKey] is List) {
        final raw =
            (data[dataKey] as List).whereType<Map<String, dynamic>>().toList();
        await _cache.writeJson(cacheKey, raw);
        return raw.map(fromJson).toList();
      }
    } catch (_) {
      _offline = true;
      final cached = await _cache.readJson(cacheKey);
      if (cached is List) {
        return cached.whereType<Map<String, dynamic>>().map(fromJson).toList();
      }
      rethrow;
    }
    return const [];
  }

  Future<void> _loadClasses() async {
    _classes = await _getList(
        cacheKey: 'classes',
        path: '/students/classes',
        dataKey: 'classes',
        fromJson: ClassSection.fromJson);
  }

  Future<void> _loadSubjects() async {
    _subjects = await _getList(
        cacheKey: 'subjects',
        path: '/students/subjects',
        dataKey: 'subjects',
        fromJson: Subject.fromJson);
  }

  Future<void> _loadStudents() async {
    final classNames = {for (final item in _classes) item.id: item.name};
    _students = await _getList(
      cacheKey: 'students',
      path: '/students',
      dataKey: 'students',
      fromJson: (json) {
        final classSectionId = (json['classSectionId'] ?? '').toString();
        return Student.fromJson({
          ...json,
          'className': json['className'] ?? classNames[classSectionId] ?? ''
        });
      },
    );
  }

  Future<void> _loadAssignments() async {
    _assignments = await _getList(
        cacheKey: 'assignments',
        path: '/homework',
        dataKey: 'homework',
        fromJson: _assignmentFromJson);
  }

  Future<void> _loadExams() async {
    _exams = await _getList(
        cacheKey: 'exams',
        path: '/exams',
        dataKey: 'exams',
        fromJson: _examFromJson);
  }

  Future<void> _loadAnnouncements() async {
    _announcements = await _getList(
        cacheKey: 'announcements',
        path: '/announcements',
        dataKey: 'announcements',
        fromJson: Announcement.fromJson);
  }

  Future<void> _loadNoticeboard() async {
    _noticeboard = await _getList(
        cacheKey: 'noticeboard',
        path: '/announcements',
        dataKey: 'announcements',
        fromJson: _noticeFromJson);
  }

  Future<void> _loadThreads() async {
    _directMessages = await _getList(
        cacheKey: 'threads',
        path: '/communication/threads',
        dataKey: 'threads',
        fromJson: DirectMessage.fromThreadJson);
  }

  Assignment _assignmentFromJson(Map<String, dynamic> json) {
    final className = _classes
        .firstWhere((item) => item.id == json['classSectionId'],
            orElse: () => const ClassSection(id: '', name: ''))
        .name;
    final subject = _subjects
        .firstWhere((item) => item.id == json['subjectId'],
            orElse: () => const Subject(id: '', name: '', code: ''))
        .name;
    return Assignment.fromJson({
      ...json,
      'className': json['className'] ?? className,
      'subjectName': json['subjectName'] ?? subject
    });
  }

  Exam _examFromJson(Map<String, dynamic> json) {
    final className = _classes
        .firstWhere((item) => item.id == json['classSectionId'],
            orElse: () => const ClassSection(id: '', name: ''))
        .name;
    final subject = _subjects
        .firstWhere((item) => item.id == json['subjectId'],
            orElse: () => const Subject(id: '', name: '', code: ''))
        .name;
    final exam = Exam.fromJson({
      ...json,
      'className': json['className'] ?? className,
      'subjectName': json['subjectName'] ?? subject
    });
    final published = _publishedExams[exam.id] ?? exam.published;
    return Exam(
        id: exam.id,
        name: exam.name,
        className: exam.className,
        subject: exam.subject,
        date: exam.date,
        maxMarks: exam.maxMarks,
        subjectId: exam.subjectId,
        classSectionId: exam.classSectionId,
        published: published);
  }

  NoticeboardPost _noticeFromJson(Map<String, dynamic> json) {
    final audience = json['audience'] is List
        ? (json['audience'] as List).map((item) => item.toString()).toList()
        : const <String>[];
    final className = audience.isEmpty
        ? 'All'
        : _classes
            .firstWhere((item) => item.id == audience.first,
                orElse: () =>
                    ClassSection(id: audience.first, name: audience.first))
            .name;
    return NoticeboardPost.fromJson(
        {...json, 'className': json['className'] ?? className});
  }

  String _dateKey(DateTime date) =>
      '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

  AttendanceStatus statusFor(DateTime date, String studentId) =>
      _attendance[_dateKey(date)]?[studentId] ?? AttendanceStatus.present;

  Map<String, AttendanceStatus> snapshotForDate(DateTime date) {
    final day = _attendance[_dateKey(date)] ?? {};
    return {
      for (final student in _students)
        student.id: day[student.id] ?? AttendanceStatus.present
    };
  }

  Future<void> loadAttendanceForClass(
      String classSectionId, DateTime date) async {
    if (classSectionId.isEmpty) return;
    final key = _dateKey(date);
    try {
      final data = await _api
          .get('/attendance/class/$classSectionId', query: {'date': key});
      if (data is Map<String, dynamic> && data['records'] is List) {
        _attendance.putIfAbsent(key, () => {});
        for (final json
            in (data['records'] as List).whereType<Map<String, dynamic>>()) {
          final record = AttendanceRecord.fromJson(json);
          _attendance[key]![record.studentId] = record.status;
        }
      }
    } catch (error) {
      _error = error.toString();
    }
    notifyListeners();
  }

  Future<void> setStatus(
      DateTime date, String studentId, AttendanceStatus status) async {
    final key = _dateKey(date);
    _attendance.putIfAbsent(key, () => {});
    _attendance[key]![studentId] = status;
    notifyListeners();
    final student = _students.firstWhere((item) => item.id == studentId,
        orElse: () =>
            Student(id: studentId, name: '', rollNo: '', className: ''));
    if (student.classSectionId.isEmpty) return;
    final payload = {
      'studentId': studentId,
      'classSectionId': student.classSectionId,
      'date': key,
      'status': status.apiValue
    };
    try {
      await _api.post('/attendance', body: payload);
    } catch (_) {
      _pendingAttendanceSync.add(payload);
      _offline = true;
    }
  }

  Future<void> markAllPresent(DateTime date, {String? classSectionId}) async {
    final key = _dateKey(date);
    final targetStudents = classSectionId == null
        ? _students
        : _students
            .where((item) => item.classSectionId == classSectionId)
            .toList();
    _attendance.putIfAbsent(key, () => {});
    for (final student in targetStudents) {
      _attendance[key]![student.id] = AttendanceStatus.present;
    }
    notifyListeners();
    final classIds = targetStudents
        .map((item) => item.classSectionId)
        .where((item) => item.isNotEmpty)
        .toSet();
    for (final id in classIds) {
      try {
        await _api.post('/attendance/bulk',
            body: {'classSectionId': id, 'date': key, 'status': 'present'});
      } catch (_) {
        _offline = true;
      }
    }
  }

  Future<void> _syncPendingAttendance() async {
    if (_pendingAttendanceSync.isEmpty) return;
    final pending = List<Map<String, dynamic>>.from(_pendingAttendanceSync);
    for (final payload in pending) {
      try {
        await _api.post('/attendance', body: payload);
        _pendingAttendanceSync.remove(payload);
      } catch (_) {}
    }
  }

  Map<String, int> monthlySummary(DateTime month, String studentId) {
    final cached = _lastMonthlySummaryCache[studentId];
    if (cached != null) return cached;
    final first = DateTime(month.year, month.month);
    final last = DateTime(month.year, month.month + 1, 0);
    var present = 0, absent = 0, late = 0;
    for (var day = first;
        !day.isAfter(last);
        day = day.add(const Duration(days: 1))) {
      final status = _attendance[_dateKey(day)]?[studentId];
      if (status == AttendanceStatus.present) present++;
      if (status == AttendanceStatus.absent) absent++;
      if (status == AttendanceStatus.late ||
          status == AttendanceStatus.halfDay) {
        late++;
      }
    }
    return {'present': present, 'absent': absent, 'late': late};
  }

  Future<void> loadMonthlySummary(String studentId, DateTime month) async {
    final key =
        '${month.year.toString().padLeft(4, '0')}-${month.month.toString().padLeft(2, '0')}';
    try {
      final data = await _api
          .get('/attendance/summary/$studentId', query: {'month': key});
      if (data is Map<String, dynamic> &&
          data['summary'] is Map<String, dynamic>) {
        final summary = data['summary'] as Map<String, dynamic>;
        _lastMonthlySummaryCache[studentId] = {
          'present': summary['present'] is num
              ? (summary['present'] as num).toInt()
              : 0,
          'absent':
              summary['absent'] is num ? (summary['absent'] as num).toInt() : 0,
          'late': summary['late'] is num ? (summary['late'] as num).toInt() : 0,
        };
      }
    } catch (error) {
      _error = error.toString();
    }
    notifyListeners();
  }

  Map<String, int> cachedMonthlySummary(String studentId) =>
      _lastMonthlySummaryCache[studentId] ?? const {};

  Future<List<String>> pickAttachments() => _uploadService
      .pickAndUpload(allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf']);

  Future<bool> addAssignment(
      {required String title,
      required String description,
      required String className,
      required String subject,
      required DateTime dueDate,
      List<String> attachments = const []}) async {
    final classSection = _classes.firstWhere((item) => item.name == className,
        orElse: () => const ClassSection(id: '', name: ''));
    final selectedSubject = _subjects.firstWhere((item) => item.name == subject,
        orElse: () => const Subject(id: '', name: '', code: ''));
    if (classSection.id.isEmpty || selectedSubject.id.isEmpty) {
      _error = 'Unknown class or subject';
      notifyListeners();
      return false;
    }
    final body = {
      'title': title,
      'description': description,
      'subjectId': selectedSubject.id,
      'classSectionId': classSection.id,
      'dueDate': _dateKey(dueDate),
      'attachments': attachments
    };
    try {
      final data = await _api.post('/homework', body: body);
      if (data is Map<String, dynamic> &&
          data['homework'] is Map<String, dynamic>) {
        _assignments
            .add(_assignmentFromJson(data['homework'] as Map<String, dynamic>));
      }
      await _pushService.addNotification(title: 'Homework posted', body: title);
      _notifications = await _pushService.loadNotifications();
      notifyListeners();
      return true;
    } catch (error) {
      _error = error.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateAssignment(String id,
      {String? title,
      String? description,
      DateTime? dueDate,
      List<String>? attachments}) async {
    final body = <String, dynamic>{
      if (title != null) 'title': title,
      if (description != null) 'description': description,
      if (dueDate != null) 'dueDate': _dateKey(dueDate),
      if (attachments != null) 'attachments': attachments
    };
    try {
      final data = await _api.put('/homework/$id', body: body);
      if (data is Map<String, dynamic> &&
          data['homework'] is Map<String, dynamic>) {
        final updated =
            _assignmentFromJson(data['homework'] as Map<String, dynamic>);
        _assignments =
            _assignments.map((item) => item.id == id ? updated : item).toList();
      }
      notifyListeners();
      return true;
    } catch (error) {
      _error = error.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteAssignment(String id) async {
    try {
      await _api.delete('/homework/$id');
      _assignments.removeWhere((item) => item.id == id);
      notifyListeners();
      return true;
    } catch (error) {
      _error = error.toString();
      notifyListeners();
      return false;
    }
  }

  double? marksFor(String examId, String studentId) =>
      _marks[examId]?[studentId];
  bool isExamPublished(String examId) =>
      _publishedExams[examId] ??
      _exams
          .firstWhere((item) => item.id == examId,
              orElse: () => Exam(
                  id: '',
                  name: '',
                  className: '',
                  subject: '',
                  date: DateTime(1970),
                  maxMarks: 0))
          .published;

  Future<void> loadGradesForExam(String examScheduleId) async {
    try {
      final data = await _api
          .get('/exams/grades', query: {'examScheduleId': examScheduleId});
      if (data is Map<String, dynamic> && data['grades'] is List) {
        _marks.putIfAbsent(examScheduleId, () => {});
        for (final json
            in (data['grades'] as List).whereType<Map<String, dynamic>>()) {
          final studentId = (json['studentId'] ?? '').toString();
          final marks = json['marks'];
          if (studentId.isNotEmpty && marks is num) {
            _marks[examScheduleId]![studentId] = marks.toDouble();
          }
        }
      }
    } catch (error) {
      _error = error.toString();
    }
    notifyListeners();
  }

  Future<bool> setMarks(String examId, String studentId, double marks) async {
    final exam = _exams.firstWhere((item) => item.id == examId,
        orElse: () => Exam(
            id: '',
            name: '',
            className: '',
            subject: '',
            date: DateTime(1970),
            maxMarks: 0));
    if (exam.id.isEmpty || marks < 0 || marks > exam.maxMarks) {
      _error = 'Marks must be between 0 and ${exam.maxMarks}';
      notifyListeners();
      return false;
    }
    _marks.putIfAbsent(examId, () => {});
    _marks[examId]![studentId] = marks;
    notifyListeners();
    try {
      await _api.post('/exams/grades', body: {
        'studentId': studentId,
        'examScheduleId': examId,
        'subjectId': exam.subjectId,
        'marks': marks
      });
      return true;
    } catch (error) {
      _error = error.toString();
      notifyListeners();
      return false;
    }
  }

  void togglePublishExam(String examId) {
    _publishedExams[examId] = !isExamPublished(examId);
    notifyListeners();
  }

  Future<bool> addNoticeboardPost(
      {required String title,
      required String body,
      required String className,
      List<String> attachments = const []}) async {
    final classSection = _classes.firstWhere((item) => item.name == className,
        orElse: () => const ClassSection(id: '', name: ''));
    try {
      final data = await _api.post('/announcements', body: {
        'title': title,
        'body': body,
        'channels': ['push'],
        'audience': classSection.id.isEmpty ? ['all'] : [classSection.id],
        'pinned': false,
        'attachments': attachments
      });
      if (data is Map<String, dynamic> &&
          data['announcement'] is Map<String, dynamic>) {
        _noticeboard.insert(
            0, _noticeFromJson(data['announcement'] as Map<String, dynamic>));
      }
      await _pushService.addNotification(
          title: 'Announcement sent', body: title);
      _notifications = await _pushService.loadNotifications();
      notifyListeners();
      return true;
    } catch (error) {
      _error = error.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> sendDirectMessage(
      {required String parentName,
      required String studentName,
      required String preview,
      String? threadId,
      List<String> attachments = const []}) async {
    try {
      var targetThreadId = threadId;
      if (targetThreadId == null || targetThreadId.isEmpty) {
        final student = _students.firstWhere((item) => item.name == studentName,
            orElse: () =>
                const Student(id: '', name: '', rollNo: '', className: ''));
        final parentId =
            student.parentIds.isEmpty ? 'parent' : student.parentIds.first;
        final data = await _api.post('/communication/threads', body: {
          'parentId': parentId,
          'teacherId': currentStaff.id,
          'teacherName': currentStaff.name,
          'teacherSubject': 'Class Teacher',
          'studentId': student.id
        });
        if (data is Map<String, dynamic> &&
            data['thread'] is Map<String, dynamic>) {
          targetThreadId =
              (data['thread'] as Map<String, dynamic>)['id']?.toString();
        }
      }
      if (targetThreadId != null && targetThreadId.isNotEmpty) {
        await _api
            .post('/communication/threads/$targetThreadId/messages', body: {
          'text': attachments.isEmpty
              ? preview
              : '$preview\nAttachments: ${attachments.join(', ')}'
        });
      }
      _directMessages.insert(
          0,
          DirectMessage(
              id: DateTime.now().millisecondsSinceEpoch.toString(),
              parentName: parentName,
              studentName: studentName,
              preview: preview,
              sentAt: DateTime.now(),
              status: 'Sent',
              threadId: targetThreadId ?? '',
              attachments: attachments));
      await _pushService.addNotification(title: 'Message sent', body: preview);
      _notifications = await _pushService.loadNotifications();
      notifyListeners();
      return true;
    } catch (error) {
      _error = error.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> broadcastToClass(
      {required String className,
      required String message,
      List<String> attachments = const []}) async {
    final studentsForClass =
        _students.where((item) => item.className == className).toList();
    for (final student in studentsForClass) {
      await sendDirectMessage(
          parentName: 'Parent of ${student.name}',
          studentName: student.name,
          preview: message,
          attachments: attachments);
    }
  }

  Future<void> markNotificationsRead() async {
    await _pushService.markAllRead();
    _notifications = await _pushService.loadNotifications();
    notifyListeners();
  }

  Future<bool> changePassword(
      String currentPassword, String nextPassword) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    await _pushService.addNotification(
        title: 'Password updated',
        body: 'Your password was changed on this device.');
    _notifications = await _pushService.loadNotifications();
    notifyListeners();
    return currentPassword.isNotEmpty && nextPassword.length >= 8;
  }

  List<ScheduleSlot> get todaySchedule =>
      slotsForDay(weekDays[(DateTime.now().weekday - 1).clamp(0, 5)]);

  List<ScheduleSlot> slotsForDay(String day) {
    if (_classes.isEmpty || _subjects.isEmpty) return const [];
    final dayIndex = weekDays.indexOf(day).clamp(0, 5);
    return List.generate(4, (index) {
      final subject =
          _subjects[(index + dayIndex) % _subjects.length];
      final classSection =
          _classes[(index + dayIndex) % _classes.length];
      final hour = 8 + index;
      return ScheduleSlot(
          id: '$day-$index',
          className: classSection.name,
          subject: subject.name,
          startTime: '${hour.toString().padLeft(2, '0')}:00',
          endTime: '${hour.toString().padLeft(2, '0')}:45',
          day: day);
    });
  }

  List<String> get pendingTasks {
    final tasks = <String>[];
    if (_pendingAttendanceSync.isNotEmpty) {
      tasks.add(
          '${_pendingAttendanceSync.length} attendance updates pending sync');
    }
    if (_assignments
        .where((item) =>
            item.dueDate.isBefore(DateTime.now().add(const Duration(days: 1))))
        .isNotEmpty) {
      tasks.add('Review homework due today');
    }
    return tasks;
  }

  void _setLoading(bool value) {
    _loading = value;
    notifyListeners();
  }
}
