import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/school_repository.dart';

class StaffAppDrawer extends StatelessWidget {
  const StaffAppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<SchoolRepository>();
    final staff = repo.currentStaff;
    final scheme = Theme.of(context).colorScheme;

    final initial = staff.avatarInitial ??
        (staff.name.isNotEmpty ? staff.name[0].toUpperCase() : '?');

    return Drawer(
      child: Column(
        children: [
          // Drawer Header
          UserAccountsDrawerHeader(
            decoration: BoxDecoration(
              color: scheme.primaryContainer,
            ),
            currentAccountPicture: CircleAvatar(
              radius: 32,
              backgroundColor: AppColors.primary,
              backgroundImage: (staff.profilePicturePath != null && staff.profilePicturePath!.trim().isNotEmpty)
                  ? NetworkImage(staff.profilePicturePath!.trim())
                  : null,
              onBackgroundImageError: (_, __) {},
              child: (staff.profilePicturePath == null || staff.profilePicturePath!.trim().isEmpty)
                  ? Text(
                      initial,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 22,
                      ),
                    )
                  : null,
            ),
            accountName: Text(
              staff.name.isEmpty ? 'Staff User' : staff.name,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: scheme.onPrimaryContainer,
              ),
            ),
            accountEmail: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  staff.email.isEmpty ? '—' : staff.email,
                  style: TextStyle(
                    fontSize: 12,
                    color: scheme.onPrimaryContainer.withValues(alpha: 0.8),
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    staff.role.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
            onDetailsPressed: () {
              Navigator.pop(context);
              context.push('/profile');
            },
          ),

          // Drawer Navigation Items
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                ListTile(
                  leading: const Icon(Icons.person_outline_rounded),
                  title: const Text('My Profile'),
                  subtitle: const Text('View staff details & assignments'),
                  onTap: () {
                    Navigator.pop(context);
                    context.push('/profile');
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.help_outline_rounded),
                  title: const Text('Support'),
                  subtitle: const Text('Get help & contact administration'),
                  onTap: () {
                    Navigator.pop(context);
                    _showSupportDialog(context);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.quiz_outlined),
                  title: const Text('F&Q (FAQ)'),
                  subtitle: const Text('Frequently asked questions'),
                  onTap: () {
                    Navigator.pop(context);
                    _showFaqDialog(context);
                  },
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.logout_rounded, color: AppColors.error),
                  title: const Text('Sign Out', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w600)),
                  onTap: () async {
                    Navigator.pop(context);
                    await repo.logout();
                  },
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              'Staff Portal v1.0.0',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: scheme.onSurfaceVariant),
            ),
          ),
        ],
      ),
    );
  }

  static void _showSupportDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.support_agent_rounded, color: AppColors.primary),
            SizedBox(width: 10),
            Text('Staff Support & Help'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Need assistance with class assignments, attendance, or grading?',
              style: TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 16),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.email_outlined, color: AppColors.primary),
              title: const Text('IT & Staff Support'),
              subtitle: const Text('staff-support@school.local'),
              onTap: () {
                launchUrl(Uri(
                  scheme: 'mailto',
                  path: 'staff-support@school.local',
                  query: 'subject=Staff Portal Help Request',
                ));
              },
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.phone_outlined, color: AppColors.success),
              title: const Text('Admin Office Desk'),
              subtitle: const Text('+1 (800) 555-0190 (Ext. 402)'),
              onTap: () {
                launchUrl(Uri(scheme: 'tel', path: '+18005550190'));
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  static void _showFaqDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.quiz_rounded, color: AppColors.primary),
            SizedBox(width: 10),
            Text('F&Q (FAQ)'),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView(
            shrinkWrap: true,
            children: const [
              ExpansionTile(
                title: Text('How do I mark attendance?'),
                children: [
                  Padding(
                    padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: Text('Go to the Attendance tab from the bottom navigation bar, select your assigned class & section, mark status for each student, and tap Save.'),
                  ),
                ],
              ),
              ExpansionTile(
                title: Text('How do I upload exam marks & homework?'),
                children: [
                  Padding(
                    padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: Text('Use the Exams or Homework tabs on the bottom navigation bar to record test scores and assign homework tasks to your class.'),
                  ),
                ],
              ),
              ExpansionTile(
                title: Text('How do I message parents?'),
                children: [
                  Padding(
                    padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: Text('Navigate to the Connect tab to inspect student communication threads and send updates directly to parents.'),
                  ),
                ],
              ),
              ExpansionTile(
                title: Text('How to update assigned classes or subjects?'),
                children: [
                  Padding(
                    padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: Text('Class & subject assignments are configured by school administration via the Admin Panel. Contact IT support to update your teaching schedule.'),
                  ),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
