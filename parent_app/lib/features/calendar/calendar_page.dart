import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../core/utils/date_utils.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/calendar_event.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/info_card.dart';

class CalendarPage extends ConsumerStatefulWidget {
  const CalendarPage({super.key});

  @override
  ConsumerState<CalendarPage> createState() => _CalendarPageState();
}

class _CalendarPageState extends ConsumerState<CalendarPage> {
  DateTime _month = DateTime.now();
  DateTime? _selected;

  @override
  Widget build(BuildContext context) {
    final eventsAsync = ref.watch(allEventsProvider);
    final events = eventsAsync.valueOrNull ?? const <SchoolEvent>[];
    final scheme = Theme.of(context).colorScheme;
    final firstDay = DateTime(_month.year, _month.month, 1);
    final daysInMonth = DateTime(_month.year, _month.month + 1, 0).day;
    final leading = firstDay.weekday % 7;

    final eventsByDay = <int, List<SchoolEvent>>{};
    for (final e in events) {
      if (e.startDate.year == _month.year && e.startDate.month == _month.month) {
        eventsByDay.putIfAbsent(e.startDate.day, () => []).add(e);
      }
    }

    final selectedEvents = _selected == null
        ? <SchoolEvent>[]
        : events.where((e) {
            final end = e.endDate ?? e.startDate;
            final sel = _selected!;
            return !e.startDate.isAfter(sel) && !end.isBefore(sel);
          }).toList();

    final now = DateTime.now();
    final upcomingEvents = _selected == null
        ? events.where((e) {
            final end = e.endDate ?? e.startDate;
            return end.isAfter(now) || e.startDate.sameDay(now);
          }).toList()
        : selectedEvents;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Calendar'),
        leading: BackButton(onPressed: () => Navigator.of(context).maybePop()),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(allEventsProvider);
          await Future<void>.delayed(const Duration(milliseconds: 300));
        },
        child: ListView(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => setState(
                        () => _month = DateTime(_month.year, _month.month - 1, 1)),
                    icon: const Icon(Icons.chevron_left_rounded),
                  ),
                  Expanded(
                    child: Center(
                      child: Text(Formatters.month(_month),
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700)),
                    ),
                  ),
                  IconButton(
                    onPressed: () => setState(
                        () => _month = DateTime(_month.year, _month.month + 1, 1)),
                    icon: const Icon(Icons.chevron_right_rounded),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Card(
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
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 7,
                          mainAxisSpacing: 4,
                          crossAxisSpacing: 4,
                          childAspectRatio: 1,
                        ),
                        itemCount: leading + daysInMonth,
                        itemBuilder: (_, i) {
                          if (i < leading) return const SizedBox.shrink();
                          final day = i - leading + 1;
                          final isSelected = _selected != null &&
                              _selected!.day == day &&
                              _selected!.month == _month.month &&
                              _selected!.year == _month.year;
                          final hasEvents = eventsByDay.containsKey(day);
                          return InkWell(
                            borderRadius: BorderRadius.circular(8),
                            onTap: () => setState(() =>
                                _selected = DateTime(_month.year, _month.month, day)),
                            child: Container(
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? scheme.primary
                                    : hasEvents
                                        ? scheme.primaryContainer
                                        : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              alignment: Alignment.center,
                              child: Text('$day',
                                  style: TextStyle(
                                    color: isSelected
                                        ? scheme.onPrimary
                                        : hasEvents
                                            ? scheme.onPrimaryContainer
                                            : scheme.onSurface,
                                    fontWeight: hasEvents || isSelected
                                        ? FontWeight.w700
                                        : FontWeight.w400,
                                  )),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text(
                _selected == null
                    ? 'Upcoming events'
                    : 'Events on ${Formatters.weekday(_selected!)}',
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
            if (upcomingEvents.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: InfoCard(
                  child: EmptyState(
                    icon: Icons.event_busy_rounded,
                    title: 'Nothing on this day',
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
                      for (var i = 0; i < upcomingEvents.length; i++) ...[
                        if (i > 0) const Divider(height: 1),
                        _EventRow(event: upcomingEvents[i]),
                      ],
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _EventRow extends ConsumerWidget {
  final SchoolEvent event;
  const _EventRow({required this.event});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final (icon, color, label) = switch (event.type) {
      CalendarEventType.holiday => (
          Icons.beach_access_rounded,
          Theme.of(context).colorScheme.primary,
          'Holiday',
        ),
      CalendarEventType.sportsDay => (Icons.sports_soccer_rounded, Colors.orange, 'Sports'),
      CalendarEventType.parentTeacherMeeting =>
        (Icons.groups_2_rounded, Colors.indigo, 'PTM'),
      CalendarEventType.exam => (Icons.assignment_rounded, Colors.red, 'Exam'),
      CalendarEventType.event =>
        (Icons.celebration_rounded, Colors.purple, 'Event'),
      CalendarEventType.other => (Icons.event_rounded, Colors.grey, 'Event'),
    };
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: color.withValues(alpha: 0.15),
        child: Icon(icon, color: color),
      ),
      title: Text(event.title,
          style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text([
        if (event.endDate != null &&
            event.endDate!.day != event.startDate.day)
          '${Formatters.dateShort(event.startDate)} – ${Formatters.dateShort(event.endDate!)}'
        else
          Formatters.weekday(event.startDate),
        if (event.startTimeLabel != null) event.startTimeLabel!,
        if (event.location != null) event.location!,
      ].join(' · ')),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(label,
                style: TextStyle(
                    color: color, fontWeight: FontWeight.w600, fontSize: 11)),
          ),
          const SizedBox(width: 4),
          IconButton(
            tooltip: 'Add to device calendar',
            icon: const Icon(Icons.event_available_rounded),
            onPressed: () async {
              final service = ref.read(calendarAddServiceProvider);
              final messenger = ScaffoldMessenger.of(context);
              final ok = await service.addEvent(event);
              messenger.showSnackBar(
                SnackBar(
                  content: Text(ok
                      ? 'Added to your calendar'
                      : 'Couldn\'t add the event to your calendar'),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
