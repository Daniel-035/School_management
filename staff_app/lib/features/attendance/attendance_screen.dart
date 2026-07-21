import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:staff_app/core/theme.dart';
import 'package:staff_app/data/models.dart';
import 'package:staff_app/data/school_repository.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  DateTime _date = DateTime.now();
  String? _classId;

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<SchoolRepository>();
    _classId ??= repo.classes.isNotEmpty ? repo.classes.first.id : null;
    final selectedStudents = _classId == null
        ? repo.students
        : repo.students
            .where((item) => item.classSectionId == _classId)
            .toList();
    final snapshot = repo.snapshotForDate(_date);
    final present = selectedStudents
        .where((student) => snapshot[student.id] == AttendanceStatus.present)
        .length;
    final absent = selectedStudents
        .where((student) => snapshot[student.id] == AttendanceStatus.absent)
        .length;
    final late = selectedStudents
        .where((student) =>
            snapshot[student.id] == AttendanceStatus.late ||
            snapshot[student.id] == AttendanceStatus.halfDay)
        .length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance'),
        actions: [
          IconButton(
              tooltip: 'Monthly Report',
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => const MonthlyReportScreen())),
              icon: const Icon(Icons.bar_chart))
        ],
      ),
      body: Column(children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Column(children: [
            Row(children: [
              Expanded(
                  child: Text(DateFormat('EEEE, d MMM yyyy').format(_date),
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 15))),
              TextButton.icon(
                onPressed: () async {
                  final picked = await showDatePicker(
                      context: context,
                      firstDate: DateTime(2024),
                      lastDate: DateTime(2030, 12, 31),
                      initialDate: _date);
                  if (picked != null) {
                    setState(() => _date = picked);
                    if (_classId != null && context.mounted) {
                      await context
                          .read<SchoolRepository>()
                          .loadAttendanceForClass(_classId!, picked);
                    }
                  }
                },
                icon: const Icon(Icons.calendar_today, size: 18),
                label: const Text('Change'),
              ),
            ]),
            DropdownButtonFormField<String>(
              initialValue: _classId,
              decoration: const InputDecoration(labelText: 'Class roster'),
              items: repo.classes
                  .map((item) =>
                      DropdownMenuItem(value: item.id, child: Text(item.name)))
                  .toList(),
              onChanged: (value) async {
                setState(() => _classId = value);
                if (value != null) {
                  await repo.loadAttendanceForClass(value, _date);
                }
              },
            ),
          ]),
        ),
        _SummaryRow(present: present, absent: absent, late: late),
        const Divider(height: 1),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () => _classId == null
                ? repo.loadAll()
                : repo.loadAttendanceForClass(_classId!, _date),
            child: selectedStudents.isEmpty
                ? ListView(
                    padding: const EdgeInsets.only(top: 96),
                    children: const [
                        Center(child: Text('No students in this class.'))
                      ])
                : GridView.builder(
                    padding: const EdgeInsets.all(12),
                    gridDelegate:
                        const SliverGridDelegateWithMaxCrossAxisExtent(
                            maxCrossAxisExtent: 520,
                            mainAxisExtent: 92,
                            crossAxisSpacing: 8,
                            mainAxisSpacing: 8),
                    itemCount: selectedStudents.length,
                    itemBuilder: (context, index) {
                      final student = selectedStudents[index];
                      return _StudentAttendanceTile(
                          student: student,
                          status:
                              snapshot[student.id] ?? AttendanceStatus.present,
                          onChanged: (next) =>
                              repo.setStatus(_date, student.id, next));
                    },
                  ),
          ),
        ),
      ]),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: FilledButton.icon(
              onPressed: () =>
                  repo.markAllPresent(_date, classSectionId: _classId),
              icon: const Icon(Icons.done_all),
              label: const Text('Mark all present')),
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final int present, absent, late;
  const _SummaryRow(
      {required this.present, required this.absent, required this.late});
  @override
  Widget build(BuildContext context) => Container(
        color: Colors.white,
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        child: Row(children: [
          _Stat(label: 'Present', value: present, color: AppColors.present),
          const SizedBox(width: 12),
          _Stat(label: 'Absent', value: absent, color: AppColors.absent),
          const SizedBox(width: 12),
          _Stat(label: 'Late/Half', value: late, color: AppColors.late)
        ]),
      );
}

class _Stat extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  const _Stat({required this.label, required this.value, required this.color});
  @override
  Widget build(BuildContext context) => Expanded(
      child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
              color: color.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10)),
          child: Column(children: [
            Text('$value',
                style: TextStyle(
                    color: color, fontWeight: FontWeight.bold, fontSize: 18)),
            Text(label, style: TextStyle(color: color, fontSize: 12))
          ])));
}

class _StudentAttendanceTile extends StatelessWidget {
  final Student student;
  final AttendanceStatus status;
  final ValueChanged<AttendanceStatus> onChanged;
  const _StudentAttendanceTile(
      {required this.student, required this.status, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '${student.name}, roll ${student.rollNo}, ${status.label}',
      child: Card(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(children: [
            CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                child: Text(student.name.isEmpty ? '?' : student.name[0],
                    style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold))),
            const SizedBox(width: 12),
            Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                  Text(student.name,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text('Roll ${student.rollNo}',
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 12))
                ])),
            SegmentedButton<AttendanceStatus>(
              style: ButtonStyle(
                  visualDensity: VisualDensity.compact,
                  textStyle: WidgetStateProperty.all(const TextStyle(
                      fontSize: 11, fontWeight: FontWeight.w600))),
              segments: const [
                ButtonSegment(
                    value: AttendanceStatus.present, label: Text('P')),
                ButtonSegment(value: AttendanceStatus.absent, label: Text('A')),
                ButtonSegment(value: AttendanceStatus.late, label: Text('L')),
                ButtonSegment(
                    value: AttendanceStatus.halfDay, label: Text('½')),
              ],
              selected: {status},
              onSelectionChanged: (set) => onChanged(set.first),
              showSelectedIcon: false,
            ),
          ]),
        ),
      ),
    );
  }
}

class MonthlyReportScreen extends StatefulWidget {
  const MonthlyReportScreen({super.key});
  @override
  State<MonthlyReportScreen> createState() => _MonthlyReportScreenState();
}

class _MonthlyReportScreenState extends State<MonthlyReportScreen> {
  late DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final repo = context.read<SchoolRepository>();
    for (final student in repo.students) {
      await repo.loadMonthlySummary(student.id, _month);
    }
  }

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<SchoolRepository>();
    return Scaffold(
      appBar: AppBar(title: const Text('Monthly Report')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView.separated(
          padding: const EdgeInsets.all(12),
          itemCount: repo.students.length + 1,
          separatorBuilder: (_, __) => const SizedBox(height: 6),
          itemBuilder: (context, index) {
            if (index == 0) {
              return Card(
                  child: ListTile(
                      title: Text(DateFormat('MMMM yyyy').format(_month)),
                      trailing: IconButton(
                          icon: const Icon(Icons.calendar_month),
                          onPressed: () async {
                            final picked = await showDatePicker(
                                context: context,
                                initialDate: _month,
                                firstDate: DateTime(2024),
                                lastDate: DateTime(2030));
                            if (picked != null) {
                              setState(() =>
                                  _month = DateTime(picked.year, picked.month));
                              await _load();
                            }
                          })));
            }
            final student = repo.students[index - 1];
            final summary = repo.monthlySummary(_month, student.id);
            final total = summary.values.fold<int>(0, (a, b) => a + b);
            final pct =
                total == 0 ? 0.0 : (summary['present']! / total) * 100.0;
            return Card(
              child: ListTile(
                leading: CircleAvatar(
                    backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                    child: Text(student.name.isEmpty ? '?' : student.name[0],
                        style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold))),
                title: Text(student.name,
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Row(children: [
                      _Pill(
                          color: AppColors.present,
                          label: 'P ${summary['present']}'),
                      const SizedBox(width: 6),
                      _Pill(
                          color: AppColors.absent,
                          label: 'A ${summary['absent']}'),
                      const SizedBox(width: 6),
                      _Pill(
                          color: AppColors.late, label: 'L ${summary['late']}'),
                      const SizedBox(width: 8),
                      Expanded(
                          child: LinearProgressIndicator(
                              value: pct / 100,
                              minHeight: 6,
                              backgroundColor: AppColors.border,
                              color: AppColors.primary)),
                      const SizedBox(width: 8),
                      Text('${pct.toStringAsFixed(0)}%',
                          style: const TextStyle(
                              fontSize: 12, color: AppColors.textSecondary))
                    ])),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final Color color;
  final String label;
  const _Pill({required this.color, required this.label});
  @override
  Widget build(BuildContext context) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(6)),
      child: Text(label,
          style: TextStyle(
              color: color, fontWeight: FontWeight.w600, fontSize: 11)));
}
