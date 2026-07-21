import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:staff_app/core/theme.dart';
import 'package:staff_app/data/models.dart';
import 'package:staff_app/data/school_repository.dart';

class TimetableScreen extends StatefulWidget {
  const TimetableScreen({super.key});

  @override
  State<TimetableScreen> createState() => _TimetableScreenState();
}

class _TimetableScreenState extends State<TimetableScreen> {
  late String _day = _todayShortName();

  String _todayShortName() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    final weekday = DateTime.now().weekday;
    return weekday >= 1 && weekday <= 6 ? days[weekday - 1] : 'Mon';
  }

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<SchoolRepository>();
    final slots = repo.slotsForDay(_day);
    final today = _todayShortName();
    return Scaffold(
      appBar: AppBar(title: const Text('My Timetable')),
      body: Column(children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
          child: Row(children: [
            for (final day in repo.weekDays)
              Padding(
                padding: const EdgeInsets.only(right: 6),
                child: ChoiceChip(
                  avatar:
                      day == today ? const Icon(Icons.today, size: 16) : null,
                  label: Text(day),
                  selected: day == _day,
                  onSelected: (_) => setState(() => _day = day),
                  selectedColor: AppColors.primary,
                  labelStyle: TextStyle(
                      color: day == _day ? Colors.white : AppColors.primary,
                      fontWeight: FontWeight.w600),
                  backgroundColor: day == today
                      ? AppColors.accent.withValues(alpha: 0.16)
                      : AppColors.primary.withValues(alpha: 0.08),
                ),
              ),
          ]),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: slots.isEmpty
              ? const Center(child: Text('No classes scheduled for this day.'))
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(12, 4, 12, 16),
                  itemCount: slots.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) => _SlotTile(
                      slot: slots[index],
                      index: index + 1,
                      highlight: _day == today),
                ),
        ),
      ]),
    );
  }
}

class _SlotTile extends StatelessWidget {
  const _SlotTile(
      {required this.slot, required this.index, required this.highlight});
  final ScheduleSlot slot;
  final int index;
  final bool highlight;

  Color get _color {
    final seed = slot.subject.hashCode.abs() % 5;
    return [
      AppColors.primary,
      AppColors.warning,
      Colors.blue,
      Colors.purple,
      Colors.teal
    ][seed];
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label:
          '${slot.subject}, ${slot.className}, ${slot.startTime} to ${slot.endTime}',
      child: Card(
        color: highlight ? _color.withValues(alpha: 0.06) : Colors.white,
        child: ListTile(
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          leading: CircleAvatar(
              backgroundColor: _color,
              child: Text('$index',
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold))),
          title: Text(slot.subject,
              style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text('Class ${slot.className} • ${slot.room}'),
          trailing: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(slot.startTime,
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                Text('to ${slot.endTime}',
                    style: const TextStyle(
                        color: AppColors.textSecondary, fontSize: 12))
              ]),
        ),
      ),
    );
  }
}
