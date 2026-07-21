import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:staff_app/data/api/api_client.dart';
import 'package:staff_app/data/models.dart';
import 'package:staff_app/data/school_repository.dart';

http.Client _makeClient({
  List<Map<String, dynamic>> students = const [],
  List<Map<String, dynamic>> homework = const [],
  List<Map<String, dynamic>> exams = const [],
  List<Map<String, dynamic>> announcements = const [],
  List<Map<String, dynamic>> classes = const [],
  List<Map<String, dynamic>> subjects = const [],
  String token = 'test-token',
  Map<String, dynamic>? user,
}) {
  return MockClient((req) async {
    final path = req.url.path;
    if (path.endsWith('/auth/login') && req.method == 'POST') {
      return http.Response(
        jsonEncode({
          'success': true,
          'data': {
            'token': token,
            'user': user ??
                {
                  'id': 'u1',
                  'name': 'Test Staff',
                  'email': 'staff@school.local',
                  'role': 'staff',
                  'status': 'active',
                },
          },
        }),
        200,
        headers: {'content-type': 'application/json'},
      );
    }
    Map<String, dynamic> data;
    if (path.endsWith('/students')) {
      data = {'students': students};
    } else if (path.endsWith('/students/classes')) {
      data = {'classes': classes};
    } else if (path.endsWith('/students/subjects')) {
      data = {'subjects': subjects};
    } else if (path.endsWith('/homework')) {
      data = {'homework': homework};
    } else if (path.endsWith('/exams')) {
      data = {'exams': exams};
    } else if (path.endsWith('/announcements')) {
      data = {'announcements': announcements};
    } else {
      data = {};
    }
    return http.Response(
      jsonEncode({'success': true, 'data': data}),
      200,
      headers: {'content-type': 'application/json'},
    );
  });
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('login persists token and loads profile', () async {
    final client = _makeClient(
      students: [
        {
          'id': 's1',
          'name': 'Aarav',
          'rollNumber': '01',
          'classSectionId': 'c1',
          'parentIds': <String>[],
        }
      ],
      classes: [
        {'id': 'c1', 'name': '6B'}
      ],
      subjects: [
        {'id': 'sub1', 'name': 'Math', 'code': 'M'}
      ],
    );
    final api = ApiClient(httpClient: client);
    final repo = SchoolRepository(client: api);
    await api.init();
    final ok = await repo.login('staff@school.local', 'staff123');
    expect(ok, isTrue);
    expect(api.isAuthenticated, isTrue);
    expect(repo.currentStaff.email, 'staff@school.local');
    expect(repo.students.length, 1);
    expect(repo.students.first.className, '6B');
  });

  test('setStatus updates local cache and reads back', () async {
    final client = _makeClient(
      students: [
        {
          'id': 's1',
          'name': 'Aarav',
          'rollNumber': '01',
          'classSectionId': 'c1',
          'parentIds': <String>[],
        }
      ],
      classes: [
        {'id': 'c1', 'name': '6B'}
      ],
    );
    final api = ApiClient(httpClient: client);
    final repo = SchoolRepository(client: api);
    await api.init();
    await repo.login('staff@school.local', 'staff123');
    final today = DateTime.now();
    await repo.setStatus(today, 's1', AttendanceStatus.absent);
    expect(repo.statusFor(today, 's1'), AttendanceStatus.absent);
    final snap = repo.snapshotForDate(today);
    expect(snap['s1'], AttendanceStatus.absent);
  });

  test('ApiClient uses the configured base URL', () async {
    late http.Request request;
    final client = MockClient((incoming) async {
      request = incoming;
      return http.Response(
        jsonEncode({'success': true, 'data': <String, dynamic>{}}),
        200,
      );
    });
    final api = ApiClient(
      baseUrl: 'https://school.example/api',
      httpClient: client,
    );

    await api.get('/students', query: {'class': '6B'});

    expect(
        request.url.toString(), 'https://school.example/api/students?class=6B');
  });

  test('monthly summary returns zero when no records', () {
    final repo = SchoolRepository();
    final month = DateTime(DateTime.now().year, DateTime.now().month);
    final summary = repo.monthlySummary(month, 'unknown');
    expect(summary['present'], 0);
    expect(summary['absent'], 0);
    expect(summary['late'], 0);
  });

  test('models parse from JSON', () {
    final s = Student.fromJson({
      'id': '1',
      'name': 'A',
      'rollNumber': '5',
      'classSectionId': 'c',
      'parentIds': ['p1'],
    });
    expect(s.rollNo, '5');
    expect(s.className, '');
    expect(s.parentIds, ['p1']);

    final a = Announcement.fromJson({
      'id': '1',
      'title': 'T',
      'body': 'B',
      'publishedAt': '2026-01-01T00:00:00Z',
      'authorName': 'A',
    });
    expect(a.postedAt.year, 2026);

    final h = Assignment.fromJson({
      'id': '1',
      'title': 'HW',
      'description': 'd',
      'subjectId': 's',
      'classSectionId': 'c',
      'dueDate': '2026-12-01T00:00:00Z',
      'attachments': <String>[],
    });
    expect(h.subjectId, 's');

    final e = Exam.fromJson({
      'id': '1',
      'subjectId': 's',
      'classSectionId': 'c',
      'title': 'E',
      'date': '2026-01-01T00:00:00Z',
      'maxMarks': 50,
    });
    expect(e.name, 'E');
    expect(e.maxMarks, 50);
  });
}
