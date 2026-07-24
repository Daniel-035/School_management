import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:staff_app/core/router.dart';
import 'package:staff_app/core/theme.dart';
import 'package:staff_app/data/models.dart';
import '../../data/school_repository.dart';
import '../../shared/widgets/app_drawer.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<SchoolRepository>();
    final staff = repo.currentStaff;
    final today = DateFormat('EEEE, d MMM').format(DateTime.now());
    final firstName = staff.name.trim().isEmpty ? 'Staff' : staff.name.trim().split(RegExp(r'\s+')).last;

    return Scaffold(
      drawer: const StaffAppDrawer(),
      appBar: AppBar(
        titleSpacing: 16,
        title: Builder(
          builder: (ctx) => InkWell(
            onTap: () => Scaffold.of(ctx).openDrawer(),
            borderRadius: BorderRadius.circular(8),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: AppColors.accent,
                  backgroundImage: (staff.profilePicturePath != null && staff.profilePicturePath!.trim().isNotEmpty)
                      ? NetworkImage(staff.profilePicturePath!.trim())
                      : null,
                  onBackgroundImageError: (_, __) {},
                  child: (staff.profilePicturePath == null || staff.profilePicturePath!.trim().isEmpty)
                      ? Text(
                          staff.avatarInitial ?? (staff.name.isNotEmpty ? staff.name[0].toUpperCase() : '?'),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Text(
                            'Hello, $firstName',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const Icon(Icons.arrow_drop_down_rounded, color: Colors.white70),
                        ],
                      ),
                      Text(
                        staff.role,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        actions: [
          IconButton(
            tooltip: 'Timetable',
            onPressed: () => context.push(AppRouter.timetable),
            icon: const Icon(Icons.calendar_month),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          _DateBanner(label: today),
          const SizedBox(height: 16),
          _SectionTitle(
            title: "Today's Schedule",
            actionLabel: 'View week',
            onAction: () => context.push(AppRouter.timetable),
          ),
          const SizedBox(height: 8),
          ...repo.todaySchedule.map((s) => _ScheduleTile(slot: s)),
          const SizedBox(height: 24),
          const _SectionTitle(title: 'Pending Tasks'),
          const SizedBox(height: 8),
          _TasksCard(tasks: repo.pendingTasks),
          const SizedBox(height: 24),
          const _SectionTitle(title: 'Recent Announcements'),
          const SizedBox(height: 8),
          ...repo.announcements.map((a) => _AnnouncementTile(a: a)),
        ],
      ),
    );
  }
}

class _DateBanner extends StatelessWidget {
  final String label;
  const _DateBanner({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.primaryDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.event, color: Colors.white),
          const SizedBox(width: 10),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;
  const _SectionTitle({required this.title, this.actionLabel, this.onAction});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
        ),
        if (actionLabel != null && onAction != null)
          TextButton(onPressed: onAction, child: Text(actionLabel!)),
      ],
    );
  }
}

class _ScheduleTile extends StatelessWidget {
  final ScheduleSlot slot;
  const _ScheduleTile({required this.slot});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        leading: SizedBox(
          width: 56,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                slot.startTime,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                  fontSize: 11,
                ),
              ),
              Text(
                slot.endTime,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ),
        title: Text(
          slot.subject,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text('Class ${slot.className} • ${slot.room}'),
        trailing:
            const Icon(Icons.chevron_right, color: AppColors.textSecondary),
      ),
    );
  }
}

class _TasksCard extends StatelessWidget {
  final List<String> tasks;
  const _TasksCard({required this.tasks});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          for (var i = 0; i < tasks.length; i++) ...[
            ListTile(
              leading: const Icon(Icons.check_circle_outline,
                  color: AppColors.primary),
              title: Text(tasks[i]),
              dense: true,
            ),
            if (i != tasks.length - 1) const Divider(height: 1),
          ],
        ],
      ),
    );
  }
}

class _AnnouncementTile extends StatelessWidget {
  final Announcement a;
  const _AnnouncementTile({required this.a});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const CircleAvatar(
          backgroundColor: AppColors.accent,
          child: Icon(Icons.campaign, color: Colors.white, size: 18),
        ),
        title:
            Text(a.title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(
          a.body,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: Text(
          DateFormat('d MMM').format(a.postedAt),
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}
