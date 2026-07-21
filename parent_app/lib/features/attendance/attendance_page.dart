import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/attendance.dart';
import '../../data/models/student.dart';
import '../../data/repositories/attendance_repository.dart';
import '../../shared/widgets/child_avatar.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/info_card.dart';
import '../../shared/widgets/section_header.dart';
import '../../shared/widgets/status_pill.dart';
import 'leave_request_sheet.dart';

class AttendancePage extends ConsumerStatefulWidget {
  const AttendancePage({super.key});

  @override
  ConsumerState<AttendancePage> createState() => _AttendancePageState();
}

class _AttendancePageState extends ConsumerState<AttendancePage> {
  DateTime _month = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final student = ref.watch(selectedStudentProvider);
    if (student == null) {
      return const Scaffold(body: EmptyState(
        icon: Icons.person_off_rounded,
        title: 'No child linked',
      ));
    }

    final summaryAsync = ref.watch(attendanceSummaryProvider(student.id));
    final monthlyAsync =
        ref.watch(attendanceRecordsProvider((id: student.id, month: _month)));
    final historyAsync = ref.watch(leaveHistoryProvider(student.id));

    final summary = summaryAsync.valueOrNull;
    final monthly = monthlyAsync.valueOrNull ?? const <AttendanceRecord>[];
    final history = historyAsync.valueOrNull ?? const <LeaveRequest>[];

    Future<void> refresh() async {
      ref.invalidate(attendanceSummaryProvider(student.id));
      ref.invalidate(attendanceRecordsProvider(
          (id: student.id, month: _month)));
      ref.invalidate(leaveHistoryProvider(student.id));
      await Future<void>.delayed(const Duration(milliseconds: 300));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance'),
        actions: [
          IconButton(
            tooltip: 'Previous month',
            icon: const Icon(Icons.chevron_left_rounded),
            onPressed: () => setState(() =>
                _month = DateTime(_month.year, _month.month - 1, 1)),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final messenger = ScaffoldMessenger.of(context);
          final created = await showModalBottomSheet<bool>(
            context: context,
            isScrollControlled: true,
            showDragHandle: true,
            builder: (_) => LeaveRequestSheet(student: student),
          );
          if (created == true && mounted) {
            messenger.showSnackBar(
              const SnackBar(content: Text('Leave request submitted.')),
            );
            refresh();
          }
        },
        icon: const Icon(Icons.beach_access_rounded),
        label: const Text('Apply for leave'),
      ),
      body: RefreshIndicator(
        onRefresh: refresh,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 96),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: _SummaryCard(
                student: student,
                summary: summary,
              ),
            ),
            const SectionHeader(title: 'This month'),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _MonthHeader(
                month: _month,
                onPrev: () => setState(
                    () => _month = DateTime(_month.year, _month.month - 1, 1)),
                onNext: () => setState(
                    () => _month = DateTime(_month.year, _month.month + 1, 1)),
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _CalendarGrid(
                month: _month,
                records: monthly,
              ),
            ),
            const SectionHeader(title: 'Leave history'),
            if (history.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: InfoCard(
                  child: EmptyState(
                    icon: Icons.event_busy_rounded,
                    title: 'No leave requests yet',
                  ),
                ),
              )
            else
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: InfoCard(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      for (var i = 0; i < history.length; i++) ...[
                        if (i > 0) const Divider(height: 1),
                        _LeaveTile(req: history[i]),
                      ],
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final Student student;
  final AttendanceSummary? summary;
  const _SummaryCard({required this.student, required this.summary});

  @override
  Widget build(BuildContext context) {
    final s = summary;
    return InfoCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ChildAvatar(initials: student.initials, size: 44),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(student.name,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700)),
                    Text('Last 30 school days',
                        style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
              Text(Formatters.percent(s?.percentPresent ?? 0),
                  style: Theme.of(context)
                      .textTheme
                      .headlineSmall
                      ?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.positive)),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _Stat(
                  label: 'Present',
                  value: s?.present ?? 0,
                  color: AppColors.positive),
              _Stat(
                  label: 'Absent',
                  value: s?.absent ?? 0,
                  color: AppColors.danger),
              _Stat(
                  label: 'Late',
                  value: s?.late ?? 0,
                  color: AppColors.warning),
              _Stat(label: 'Total', value: s?.total ?? 0, color: null),
            ],
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final int value;
  final Color? color;
  const _Stat({required this.label, required this.value, this.color});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Expanded(
      child: Column(
        children: [
          Text('$value',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: color ?? scheme.onSurface,
                  )),
          Text(label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: scheme.onSurfaceVariant,
                  )),
        ],
      ),
    );
  }
}

class _MonthHeader extends StatelessWidget {
  final DateTime month;
  final VoidCallback onPrev;
  final VoidCallback onNext;
  const _MonthHeader({required this.month, required this.onPrev, required this.onNext});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        IconButton(
          onPressed: onPrev,
          icon: const Icon(Icons.chevron_left_rounded),
        ),
        Expanded(
          child: Center(
            child: Text(Formatters.month(month),
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.w700)),
          ),
        ),
        IconButton(
          onPressed: onNext,
          icon: const Icon(Icons.chevron_right_rounded),
        ),
      ],
    );
  }
}

class _CalendarGrid extends StatelessWidget {
  final DateTime month;
  final List<AttendanceRecord> records;
  const _CalendarGrid({required this.month, required this.records});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final firstDay = DateTime(month.year, month.month, 1);
    final daysInMonth = DateTime(month.year, month.month + 1, 0).day;
    final leadingBlanks = firstDay.weekday % 7;

    final recordByDay = <int, AttendanceRecord>{};
    for (final r in records) {
      recordByDay[r.date.day] = r;
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              children: const ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                  .map((l) => Expanded(
                        child: Center(
                          child: Text(l,
                              style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: scheme.onSurfaceVariant)),
                        ),
                      ))
                  .toList(),
            ),
            const SizedBox(height: 8),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 7,
                mainAxisSpacing: 4,
                crossAxisSpacing: 4,
                childAspectRatio: 1,
              ),
              itemCount: leadingBlanks + daysInMonth,
              itemBuilder: (context, i) {
                if (i < leadingBlanks) return const SizedBox.shrink();
                final day = i - leadingBlanks + 1;
                final rec = recordByDay[day];
                return _DayCell(day: day, record: rec);
              },
            ),
            const SizedBox(height: 8),
            const _Legend(),
          ],
        ),
      ),
    );
  }
}

class _DayCell extends StatelessWidget {
  final int day;
  final AttendanceRecord? record;
  const _DayCell({required this.day, required this.record});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    Color bg;
    Color fg;
    if (record == null) {
      bg = scheme.surfaceContainerHighest.withValues(alpha: 0.4);
      fg = scheme.onSurfaceVariant;
    } else {
      switch (record!.status) {
        case AttendanceStatus.present:
          bg = AppColors.positive.withValues(alpha: 0.18);
          fg = AppColors.positive;
          break;
        case AttendanceStatus.absent:
          bg = AppColors.danger.withValues(alpha: 0.18);
          fg = AppColors.danger;
          break;
        case AttendanceStatus.late:
          bg = AppColors.warning.withValues(alpha: 0.18);
          fg = AppColors.warning;
          break;
        case AttendanceStatus.onLeave:
          bg = scheme.tertiary.withValues(alpha: 0.18);
          fg = scheme.tertiary;
          break;
      }
    }
    return Container(
      decoration:
          BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
      alignment: Alignment.center,
      child: Text('$day',
          style: TextStyle(color: fg, fontWeight: FontWeight.w600)),
    );
  }
}

class _Legend extends StatelessWidget {
  const _Legend();
  @override
  Widget build(BuildContext context) {
    return const Wrap(
      spacing: 12,
      runSpacing: 6,
      children: [
        _LegendDot(label: 'Present', color: AppColors.positive),
        _LegendDot(label: 'Absent', color: AppColors.danger),
        _LegendDot(label: 'Late', color: AppColors.warning),
      ],
    );
  }
}

class _LegendDot extends StatelessWidget {
  final String label;
  final Color color;
  const _LegendDot({required this.label, required this.color});
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

class _LeaveTile extends StatelessWidget {
  final LeaveRequest req;
  const _LeaveTile({required this.req});

  @override
  Widget build(BuildContext context) {
    final (label, color, icon) = switch (req.status) {
      LeaveStatus.pending => (
          'Pending',
          AppColors.warning,
          Icons.hourglass_top_rounded
        ),
      LeaveStatus.approved => (
          'Approved',
          AppColors.positive,
          Icons.check_circle_rounded
        ),
      LeaveStatus.rejected => (
          'Rejected',
          AppColors.danger,
          Icons.cancel_rounded
        ),
    };
    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(Formatters.dateRange(req.fromDate, req.toDate),
          style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(req.reason, maxLines: 2, overflow: TextOverflow.ellipsis),
      trailing: StatusPill(label: label, color: color),
    );
  }
}
