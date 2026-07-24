import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../core/constants/app_constants.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/attendance.dart';
import '../../data/models/calendar_event.dart';
import '../../data/models/communication.dart';
import '../../data/models/student.dart';
import '../../shared/widgets/app_drawer.dart';
import '../../shared/widgets/child_avatar.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/info_card.dart';
import '../../shared/widgets/section_header.dart';
import '../../shared/widgets/status_pill.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  static String _getInitials(String name) {
    final clean = name.trim();
    if (clean.isEmpty) return '?';
    final parts = clean.split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final parent = ref.watch(authControllerProvider).valueOrNull;
    final childrenAsync = ref.watch(linkedChildrenProvider);
    final children = childrenAsync.valueOrNull ?? const <Student>[];
    final selectedId = ref.watch(selectedChildIdProvider);

    if (parent == null) {
      return const Scaffold(body: SizedBox.shrink());
    }

    final parentFirstName = parent.name.trim().isEmpty ? 'Parent' : parent.name.trim().split(RegExp(r'\s+')).first;

    if (children.isEmpty) {
      return Scaffold(
        drawer: const AppDrawer(),
        appBar: AppBar(
          title: Builder(
            builder: (ctx) => InkWell(
              onTap: () => Scaffold.of(ctx).openDrawer(),
              borderRadius: BorderRadius.circular(8),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ChildAvatar(
                    initials: _getInitials(parent.name),
                    size: 32,
                    imageUrl: parent.avatarUrl,
                  ),
                  const SizedBox(width: 8),
                  Text('Hi, $parentFirstName'),
                  const Icon(Icons.arrow_drop_down_rounded),
                ],
              ),
            ),
          ),
        ),
        body: const EmptyState(
          icon: Icons.person_off_rounded,
          title: 'No child linked to this account',
          message: 'Please contact the school office to link a child.',
        ),
      );
    }

    final selected = children.firstWhere(
      (c) => c.id == selectedId,
      orElse: () => children.first,
    );

    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(
        title: Builder(
          builder: (ctx) => InkWell(
            onTap: () => Scaffold.of(ctx).openDrawer(),
            borderRadius: BorderRadius.circular(8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                ChildAvatar(
                  initials: _getInitials(parent.name),
                  size: 32,
                  imageUrl: parent.avatarUrl,
                ),
                const SizedBox(width: 8),
                Text('Hi, $parentFirstName'),
                const Icon(Icons.arrow_drop_down_rounded),
              ],
            ),
          ),
        ),
        actions: [
          _NotificationBell(unread: ref.watch(unreadNotificationCountProvider)),
          IconButton(
            tooltip: 'Switch child',
            icon: const Icon(Icons.switch_account_rounded),
            onPressed: children.length > 1
                ? () => _pickChild(context, ref, children)
                : null,
          ),
          IconButton(
            tooltip: 'Calendar',
            icon: const Icon(Icons.calendar_month_rounded),
            onPressed: () => context.go('/home?tab=4'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async =>
            await Future<void>.delayed(const Duration(milliseconds: 600)),
        child: ListView(
          padding: const EdgeInsets.only(bottom: 24),
          children: [
            if (children.length > 1)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: _ChildSwitcher(
                  children: children,
                  selectedId: selected.id,
                  onChanged: (id) =>
                      ref.read(selectedChildIdProvider.notifier).set(id),
                ),
              ),
            _TodayCard(student: selected),
            const SectionHeader(title: 'Today at a glance'),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _SnapshotGrid(student: selected),
            ),
            SectionHeader(
              title: 'Notices',
              actionLabel: 'See all',
              onAction: () => context.go('/home?tab=4'),
            ),
            _AnnouncementsPreview(),
            const SectionHeader(title: 'Upcoming this month'),
            _UpcomingEvents(),
          ],
        ),
      ),
    );
  }

  static Future<void> _pickChild(
      BuildContext context, WidgetRef ref, List<Student> children) async {
    final id = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          children: children
              .map((c) => ListTile(
                    leading: ChildAvatar(initials: c.initials),
                    title: Text(c.name),
                    subtitle: Text(c.classSection.label),
                    onTap: () => Navigator.pop(ctx, c.id),
                  ))
              .toList(),
        ),
      ),
    );
    if (id != null) {
      ref.read(selectedChildIdProvider.notifier).set(id);
    }
  }
}

class _NotificationBell extends StatelessWidget {
  final int unread;
  const _NotificationBell({required this.unread});

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          tooltip: 'Notifications',
          icon: const Icon(Icons.notifications_none_rounded),
          onPressed: () => GoRouter.of(context).push('/notifications'),
        ),
        if (unread > 0)
          Positioned(
            right: 6,
            top: 6,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.error,
                borderRadius: BorderRadius.circular(999),
              ),
              constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
              child: Text(
                unread > 9 ? '9+' : '$unread',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onError,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _ChildSwitcher extends StatelessWidget {
  final List<Student> children;
  final String selectedId;
  final ValueChanged<String> onChanged;
  const _ChildSwitcher({
    required this.children,
    required this.selectedId,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 64,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: children.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, i) {
          final c = children[i];
          final selected = c.id == selectedId;
          final scheme = Theme.of(context).colorScheme;
          return InkWell(
            onTap: () => onChanged(c.id),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: selected ? scheme.primaryContainer : scheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: selected ? scheme.primary : scheme.outlineVariant,
                  width: selected ? 1.6 : 1,
                ),
              ),
              child: Row(
                children: [
                  ChildAvatar(initials: c.initials, size: 36),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(c.name,
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                      Text(c.classSection.label,
                          style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _TodayCard extends ConsumerWidget {
  final Student student;
  const _TodayCard({required this.student});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(attendanceSummaryProvider(student.id));
    final latest = summary.valueOrNull?.latest;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: InfoCard(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            ChildAvatar(initials: student.initials, size: 56),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(student.name,
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text(
                      '${student.classSection.label} · Roll ${student.rollNumber}',
                      style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 8),
                  if (latest != null)
                    _StatusForDay(record: latest)
                  else
                    const Text('No attendance data yet'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusForDay extends StatelessWidget {
  final AttendanceRecord record;
  const _StatusForDay({required this.record});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final (label, color, icon) = switch (record.status) {
      AttendanceStatus.present => (
          'Present today',
          AppColors.positive,
          Icons.check_circle_rounded
        ),
      AttendanceStatus.absent => (
          'Absent today',
          AppColors.danger,
          Icons.cancel_rounded
        ),
      AttendanceStatus.late => (
          'Late today',
          AppColors.warning,
          Icons.schedule_rounded
        ),
      AttendanceStatus.onLeave => (
          'On leave today',
          scheme.tertiary,
          Icons.beach_access_rounded
        ),
    };
    return Row(
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 6),
        Text(label,
            style: TextStyle(color: color, fontWeight: FontWeight.w600)),
        const Spacer(),
        Text(Formatters.date(record.date),
            style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

class _SnapshotGrid extends ConsumerWidget {
  final Student student;
  const _SnapshotGrid({required this.student});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(attendanceSummaryProvider(student.id)).valueOrNull;
    final fees = ref.watch(feesSummaryProvider(student.id)).valueOrNull;
    return Row(
      children: [
        Expanded(
          child: _SnapshotTile(
            icon: Icons.event_available_rounded,
            label: 'Attendance',
            value: Formatters.percent(summary?.percentPresent ?? 0),
            color: AppColors.positive,
            onTap: () => context.go('/home?tab=1'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _SnapshotTile(
            icon: Icons.account_balance_wallet_rounded,
            label: 'Outstanding',
            value: Formatters.currency(fees?.outstanding ?? 0),
            color: (fees?.outstanding ?? 0) > 0
                ? AppColors.warning
                : AppColors.positive,
            onTap: () => context.go('/home?tab=3'),
          ),
        ),
      ],
    );
  }
}

class _SnapshotTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final VoidCallback onTap;
  const _SnapshotTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: InfoCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 12),
            Text(value,
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 2),
            Text(label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    )),
          ],
        ),
      ),
    );
  }
}

class _AnnouncementsPreview extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listAsync = ref.watch(announcementsProvider);
    final list = listAsync.valueOrNull ?? const <Announcement>[];
    if (list.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 16),
        child: InfoCard(
            child: EmptyState(
          icon: Icons.campaign_outlined,
          title: 'No new notices',
        )),
      );
    }
    return SizedBox(
      height: 150,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: list.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, i) {
          final a = list[i];
          return SizedBox(
            width: 280,
            child: InfoCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      if (a.pinned)
                        const StatusPill(
                          label: 'Pinned',
                          color: AppColors.warning,
                          icon: Icons.push_pin_rounded,
                        ),
                      const Spacer(),
                      Text(Formatters.date(a.publishedAt),
                          style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(a.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context)
                          .textTheme
                          .titleSmall
                          ?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  Expanded(
                    child: Text(
                      a.body,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _UpcomingEvents extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(upcomingEventsProvider);
    final events = eventsAsync.valueOrNull ?? const <SchoolEvent>[];
    if (events.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 16),
        child: InfoCard(
          child: EmptyState(
            icon: Icons.event_busy_rounded,
            title: 'No upcoming events',
          ),
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: InfoCard(
        padding: EdgeInsets.zero,
        child: Column(
          children: [
            for (var i = 0; i < events.length; i++) ...[
              if (i > 0) const Divider(height: 1),
              _EventTile(event: events[i]),
            ],
          ],
        ),
      ),
    );
  }
}

class _EventTile extends StatelessWidget {
  final SchoolEvent event;
  const _EventTile({required this.event});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final (icon, color) = switch (event.type) {
      CalendarEventType.holiday => (
          Icons.beach_access_rounded,
          AppColors.positive
        ),
      CalendarEventType.sportsDay => (
          Icons.sports_soccer_rounded,
          AppColors.warning
        ),
      CalendarEventType.parentTeacherMeeting => (
          Icons.groups_2_rounded,
          scheme.primary
        ),
      CalendarEventType.exam => (Icons.assignment_rounded, AppColors.danger),
      CalendarEventType.event => (Icons.celebration_rounded, scheme.tertiary),
      CalendarEventType.other => (Icons.event_rounded, scheme.outline),
    };
    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 22),
      ),
      title: Text(event.title,
          style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(Formatters.weekday(event.startDate)),
      trailing: event.startTimeLabel != null
          ? Text(event.startTimeLabel!,
              style: Theme.of(context).textTheme.bodySmall)
          : null,
    );
  }
}
