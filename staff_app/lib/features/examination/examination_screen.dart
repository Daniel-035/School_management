import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:staff_app/core/theme.dart';
import 'package:staff_app/data/models.dart';
import 'package:staff_app/data/school_repository.dart';

class ExaminationScreen extends StatefulWidget {
  const ExaminationScreen({super.key});

  @override
  State<ExaminationScreen> createState() => _ExaminationScreenState();
}

class _ExaminationScreenState extends State<ExaminationScreen> {
  String? _selectedExamId;

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<SchoolRepository>();
    final exams = repo.exams;
    _selectedExamId ??= exams.isNotEmpty ? exams.first.id : null;
    final selected = exams.firstWhere(
      (e) => e.id == _selectedExamId,
      orElse: () => exams.first,
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Examination & Grading')),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Exam',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                    )),
                const SizedBox(height: 6),
                DropdownButtonFormField<String>(
                  initialValue: _selectedExamId,
                  isExpanded: true,
                  items: exams
                      .map((e) => DropdownMenuItem(
                            value: e.id,
                            child: Text(
                              '${e.name} • ${e.subject} • ${e.className}',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() => _selectedExamId = v),
                ),
                if (selected.id.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      'Held on ${DateFormat('d MMM yyyy').format(selected.date)} • Max ${selected.maxMarks}',
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: selected.id.isEmpty
                ? const _EmptyExams()
                : ListView(
                    padding: const EdgeInsets.all(12),
                    children: [
                      _PerformanceSummary(exam: selected),
                      const SizedBox(height: 12),
                      _MarksCard(exam: selected),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _EmptyExams extends StatelessWidget {
  const _EmptyExams();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.grading_outlined,
              size: 64, color: AppColors.textSecondary),
          SizedBox(height: 8),
          Text('No exams available'),
        ],
      ),
    );
  }
}

class _PerformanceSummary extends StatelessWidget {
  final Exam exam;
  const _PerformanceSummary({required this.exam});

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<SchoolRepository>();
    final students =
        repo.students.where((s) => s.className == exam.className).toList();
    if (students.isEmpty) return const SizedBox.shrink();
    final marks = <double>[
      for (final s in students) repo.marksFor(exam.id, s.id) ?? 0,
    ];
    final avg =
        marks.isEmpty ? 0.0 : marks.reduce((a, b) => a + b) / marks.length;
    final highest = marks.isEmpty ? 0.0 : marks.reduce((a, b) => a > b ? a : b);
    final passPct = marks.isEmpty
        ? 0.0
        : marks.where((m) => m >= exam.maxMarks * 0.4).length /
            marks.length *
            100;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Class Performance',
                style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            SizedBox(
              height: 140,
              child: BarChart(
                BarChartData(
                  gridData: const FlGridData(show: false),
                  borderData: FlBorderData(show: false),
                  titlesData: FlTitlesData(
                    leftTitles: const AxisTitles(),
                    rightTitles: const AxisTitles(),
                    topTitles: const AxisTitles(),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          if (value.toInt() >= marks.length) {
                            return const SizedBox.shrink();
                          }
                          final s = students[value.toInt()];
                          return Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              s.name.split(' ').first.substring(0, 1),
                              style: const TextStyle(fontSize: 10),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  barGroups: [
                    for (var i = 0; i < marks.length; i++)
                      BarChartGroupData(
                        x: i,
                        barRods: [
                          BarChartRodData(
                            toY: marks[i],
                            color: AppColors.primary,
                            width: 12,
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(3),
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _MetricTile(label: 'Average', value: avg.toStringAsFixed(1)),
                const SizedBox(width: 8),
                _MetricTile(
                    label: 'Highest', value: highest.toStringAsFixed(0)),
                const SizedBox(width: 8),
                _MetricTile(
                    label: 'Pass %', value: '${passPct.toStringAsFixed(0)}%'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  final String label;
  final String value;
  const _MetricTile({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Text(value,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                )),
            Text(label,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                )),
          ],
        ),
      ),
    );
  }
}

class _MarksCard extends StatefulWidget {
  final Exam exam;
  const _MarksCard({required this.exam});

  @override
  State<_MarksCard> createState() => _MarksCardState();
}

class _MarksCardState extends State<_MarksCard> {
  late final Map<String, TextEditingController> _controllers = {};

  @override
  void initState() {
    super.initState();
    final repo = context.read<SchoolRepository>();
    for (final s
        in repo.students.where((s) => s.className == widget.exam.className)) {
      final m = repo.marksFor(widget.exam.id, s.id);
      _controllers[s.id] =
          TextEditingController(text: m == null ? '' : m.toStringAsFixed(0));
    }
  }

  @override
  void didUpdateWidget(covariant _MarksCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.exam.id != widget.exam.id) {
      _controllers.clear();
      final repo = context.read<SchoolRepository>();
      for (final s
          in repo.students.where((s) => s.className == widget.exam.className)) {
        final m = repo.marksFor(widget.exam.id, s.id);
        _controllers[s.id] =
            TextEditingController(text: m == null ? '' : m.toStringAsFixed(0));
      }
    }
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  void _save() {
    final repo = context.read<SchoolRepository>();
    for (final entry in _controllers.entries) {
      final v = double.tryParse(entry.value.text.trim());
      if (v != null) {
        repo.setMarks(widget.exam.id, entry.key, v);
      }
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Marks saved')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<SchoolRepository>();
    final students = repo.students
        .where((s) => s.className == widget.exam.className)
        .toList();
    if (students.isEmpty) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 6),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text('Enter Marks',
                      style: TextStyle(fontWeight: FontWeight.w700)),
                ),
                Text('Max ${widget.exam.maxMarks}',
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                    )),
              ],
            ),
            const SizedBox(height: 8),
            for (final s in students)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${s.rollNo}. ${s.name}',
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                    ),
                    SizedBox(
                      width: 80,
                      child: TextField(
                        controller: _controllers[s.id],
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        decoration: const InputDecoration(
                          isDense: true,
                          contentPadding:
                              EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                          hintText: '—',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 10),
            FilledButton.icon(
              onPressed: _save,
              icon: const Icon(Icons.save),
              label: const Text('Save marks'),
            ),
          ],
        ),
      ),
    );
  }
}
