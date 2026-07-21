import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../core/utils/date_utils.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/academics.dart';
import '../../data/models/homework.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/info_card.dart';
import '../../shared/widgets/status_pill.dart';

class AcademicsPage extends ConsumerStatefulWidget {
  const AcademicsPage({super.key});
  @override
  ConsumerState<AcademicsPage> createState() => _AcademicsPageState();
}

class _AcademicsPageState extends ConsumerState<AcademicsPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 3, vsync: this);

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final student = ref.watch(selectedStudentProvider);
    if (student == null) {
      return const Scaffold(
        body: EmptyState(
          icon: Icons.person_off_rounded,
          title: 'No child linked',
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: const Text('Academics'),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'Homework'),
            Tab(text: 'Report Cards'),
            Tab(text: 'Exams'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _HomeworkTab(classSectionId: student.classSection.id),
          _ReportCardsTab(studentId: student.id),
          _ExamsTab(classSectionId: student.classSection.id),
        ],
      ),
    );
  }
}

class _HomeworkTab extends ConsumerWidget {
  final String classSectionId;
  const _HomeworkTab({required this.classSectionId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingAsync =
        ref.watch(homeworkPendingProvider(classSectionId));
    final overdueAsync =
        ref.watch(homeworkOverdueProvider(classSectionId));
    final pending = pendingAsync.valueOrNull ?? const <Homework>[];
    final overdue = overdueAsync.valueOrNull ?? const <Homework>[];
    if (pendingAsync.isLoading && overdueAsync.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (pending.isEmpty && overdue.isEmpty) {
      return const EmptyState(
        icon: Icons.menu_book_rounded,
        title: 'No homework right now',
        message: 'Enjoy the break!',
      );
    }
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      children: [
        if (overdue.isNotEmpty) ...[
          const _SectionLabel('Overdue', color: AppColors.danger),
          for (final h in overdue) _HomeworkCard(homework: h, overdue: true),
          const SizedBox(height: 16),
        ],
        const _SectionLabel('Upcoming', color: AppColors.positive),
        for (final h in pending) _HomeworkCard(homework: h),
      ],
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  final Color color;
  const _SectionLabel(this.text, {required this.color});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text,
          style: TextStyle(
              color: color, fontWeight: FontWeight.w700, fontSize: 13)),
    );
  }
}

class _HomeworkCard extends StatelessWidget {
  final Homework homework;
  final bool overdue;
  const _HomeworkCard({required this.homework, this.overdue = false});

  @override
  Widget build(BuildContext context) {
    final days = homework.dueDate.difference(DateTime.now().atMidnight).inDays;
    final dueText = overdue
        ? 'Was due ${Formatters.date(homework.dueDate)}'
        : days == 0
            ? 'Due today'
            : days == 1
                ? 'Due tomorrow'
                : 'Due in $days days · ${Formatters.date(homework.dueDate)}';
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InfoCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(homework.title,
                      style: Theme.of(context)
                          .textTheme
                          .titleSmall
                          ?.copyWith(fontWeight: FontWeight.w700)),
                ),
                StatusPill(
                  label: homework.subjectName,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(homework.description,
                style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.event_rounded,
                    size: 16,
                    color: overdue
                        ? AppColors.danger
                        : Theme.of(context).colorScheme.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(dueText,
                    style: TextStyle(
                        color: overdue
                            ? AppColors.danger
                            : Theme.of(context).colorScheme.onSurfaceVariant,
                        fontSize: 12,
                        fontWeight: FontWeight.w600)),
                const Spacer(),
                if (homework.teacherName != null)
                  Text('by ${homework.teacherName}',
                      style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ReportCardsTab extends ConsumerWidget {
  final String studentId;
  const _ReportCardsTab({required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cardsAsync = ref.watch(reportCardsProvider(studentId));
    final cards = cardsAsync.valueOrNull ?? const <ReportCard>[];
    if (cardsAsync.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (cards.isEmpty) {
      return const EmptyState(
        icon: Icons.assignment_rounded,
        title: 'No report cards yet',
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: cards.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) => _ReportCardCard(card: cards[i]),
    );
  }
}

class _ReportCardCard extends StatelessWidget {
  final ReportCard card;
  const _ReportCardCard({required this.card});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return InfoCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(card.term,
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.w700)),
              ),
              StatusPill(
                label: 'Issued ${Formatters.dateShort(card.issuedOn)}',
                color: scheme.primary,
                icon: Icons.verified_rounded,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _MiniStat(
                label: 'Overall',
                value: Formatters.percent(card.overallPercent),
                color: _gradeColor(card.overallPercent),
              ),
              _MiniStat(
                label: 'Attendance',
                value: Formatters.percent(card.attendancePercent),
                color: AppColors.positive,
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 8),
          for (final g in card.grades)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Expanded(child: Text(g.subjectName)),
                  SizedBox(
                    width: 80,
                    child: LinearProgressIndicator(
                      value: (g.percent / 100).clamp(0.0, 1.0),
                      minHeight: 6,
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                  const SizedBox(width: 12),
                  SizedBox(
                    width: 64,
                    child: Text(
                      '${g.marksObtained.toInt()}/${g.maxMarks.toInt()}',
                      textAlign: TextAlign.end,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(width: 12),
                  StatusPill(label: g.grade, color: _gradeColor(g.percent)),
                ],
              ),
            ),
          if (card.classTeacherRemark != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: scheme.primaryContainer.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.format_quote_rounded, color: scheme.primary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(card.classTeacherRemark!,
                        style: Theme.of(context).textTheme.bodyMedium),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              OutlinedButton.icon(
                onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Downloading report card...')),
                ),
                icon: const Icon(Icons.download_rounded),
                label: const Text('Download'),
              ),
              const SizedBox(width: 12),
              OutlinedButton.icon(
                onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Sharing report card...')),
                ),
                icon: const Icon(Icons.share_rounded),
                label: const Text('Share'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _gradeColor(double pct) {
    if (pct >= 85) return AppColors.positive;
    if (pct >= 60) return AppColors.warning;
    return AppColors.danger;
  }
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _MiniStat(
      {required this.label, required this.value, required this.color});
  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: color,
                  )),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _ExamsTab extends ConsumerWidget {
  final String classSectionId;
  const _ExamsTab({required this.classSectionId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final examsAsync = ref.watch(examsProvider(classSectionId));
    final exams = examsAsync.valueOrNull ?? const <ExamSchedule>[];
    if (examsAsync.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (exams.isEmpty) {
      return const EmptyState(
        icon: Icons.event_note_rounded,
        title: 'No upcoming exams',
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: exams.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) => _ExamCard(exam: exams[i]),
    );
  }
}

class _ExamCard extends StatelessWidget {
  final ExamSchedule exam;
  const _ExamCard({required this.exam});
  @override
  Widget build(BuildContext context) {
    final days = exam.date.difference(DateTime.now().atMidnight).inDays;
    final label = days == 0
        ? 'Today'
        : days == 1
            ? 'Tomorrow'
            : 'In $days days';
    return InfoCard(
      child: Row(
        children: [
          Container(
            width: 56,
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Text(Formatters.dateShort(exam.date).split(' ').first,
                    style: const TextStyle(fontWeight: FontWeight.w700)),
                Text(Formatters.dateShort(exam.date).split(' ').last,
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(exam.subjectName,
                    style: Theme.of(context)
                        .textTheme
                        .titleSmall
                        ?.copyWith(fontWeight: FontWeight.w700)),
                Text('${exam.examName} · ${exam.startTime}–${exam.endTime}',
                    style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 4),
                Text('Room ${exam.room} · Max marks ${exam.maxMarks.toInt()}',
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          StatusPill(
            label: label,
            color: days <= 2
                ? AppColors.danger
                : Theme.of(context).colorScheme.primary,
            icon: Icons.timer_outlined,
          ),
        ],
      ),
    );
  }
}
