import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/app_constants.dart';
import '../../core/providers.dart';
import '../../data/models/user.dart';
import 'child_avatar.dart';

class AppDrawer extends ConsumerWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final parent = ref.watch(authControllerProvider).valueOrNull;
    final scheme = Theme.of(context).colorScheme;

    if (parent == null) return const Drawer(child: SizedBox.shrink());

    final String initials = _getInitials(parent.name);

    return Drawer(
      child: Column(
        children: [
          // Drawer Header
          UserAccountsDrawerHeader(
            decoration: BoxDecoration(
              color: scheme.primaryContainer,
            ),
            currentAccountPicture: ChildAvatar(
              initials: initials,
              size: 64,
              imageUrl: parent.avatarUrl,
            ),
            accountName: Text(
              parent.name.isEmpty ? 'User' : parent.name,
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
                  parent.email.isEmpty ? '—' : parent.email,
                  style: TextStyle(
                    fontSize: 12,
                    color: scheme.onPrimaryContainer.withValues(alpha: 0.8),
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: scheme.primary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _roleLabel(parent.role),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: scheme.onPrimary,
                    ),
                  ),
                ),
              ],
            ),
            onDetailsPressed: () {
              Navigator.pop(context);
              context.go('/profile');
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
                  subtitle: const Text('View account and child details'),
                  onTap: () {
                    Navigator.pop(context);
                    context.go('/profile');
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.help_outline_rounded),
                  title: const Text('Support'),
                  subtitle: const Text('Get help & contact school'),
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
                  leading: const Icon(Icons.logout_rounded, color: AppColors.danger),
                  title: const Text('Sign Out', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w600)),
                  onTap: () async {
                    Navigator.pop(context);
                    await ref.read(authControllerProvider.notifier).logout();
                    if (context.mounted) context.go('/login');
                  },
                ),
              ],
            ),
          ),
          
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              'App Version 1.0.0',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: scheme.onSurfaceVariant),
            ),
          ),
        ],
      ),
    );
  }

  static String _getInitials(String name) {
    final clean = name.trim();
    if (clean.isEmpty) return '?';
    final parts = clean.split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }

  static String _roleLabel(UserRole role) {
    switch (role) {
      case UserRole.admin:
        return 'ADMIN';
      case UserRole.staff:
        return 'STAFF';
      case UserRole.teacher:
        return 'TEACHER';
      case UserRole.student:
        return 'STUDENT';
      case UserRole.parent:
        return 'PARENT';
    }
  }

  static void _showSupportDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.support_agent_rounded, color: Theme.of(ctx).colorScheme.primary),
            const SizedBox(width: 10),
            const Text('Support & Help'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Need assistance with your account, fees, or school updates?',
              style: TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 16),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.email_outlined, color: Theme.of(ctx).colorScheme.primary),
              title: const Text('Email Support'),
              subtitle: const Text('support@schoolcompanion.app'),
              onTap: () {
                launchUrl(Uri(
                  scheme: 'mailto',
                  path: 'support@schoolcompanion.app',
                  query: 'subject=Help Request - Parent App',
                ));
              },
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.phone_outlined, color: AppColors.positive),
              title: const Text('School Helpline'),
              subtitle: const Text('+1 (800) 555-0199 (Mon-Fri 8 AM - 4 PM)'),
              onTap: () {
                launchUrl(Uri(scheme: 'tel', path: '+18005550199'));
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
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.quiz_rounded, color: Theme.of(ctx).colorScheme.primary),
            const SizedBox(width: 10),
            const Text('F&Q (FAQ)'),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView(
            shrinkWrap: true,
            children: const [
              ExpansionTile(
                title: Text('How do I switch between children?'),
                children: [
                  Padding(
                    padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: Text('Tap the "Switch Child" button at the top right of the home dashboard or choose from the linked children list in your Profile.'),
                  ),
                ],
              ),
              ExpansionTile(
                title: Text('How do I update profile information?'),
                children: [
                  Padding(
                    padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: Text('Official profile details (names, contact numbers, address) are managed by the school administration. Please contact the school office to update records.'),
                  ),
                ],
              ),
              ExpansionTile(
                title: Text('How do I pay school fees?'),
                children: [
                  Padding(
                    padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: Text('Navigate to the Fees tab at the bottom navigation bar to view outstanding invoices and pay securely online.'),
                  ),
                ],
              ),
              ExpansionTile(
                title: Text('How do I view attendance & report leave?'),
                children: [
                  Padding(
                    padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: Text('Use the Attendance tab on the bottom menu bar to inspect daily logs and submit leave requests directly to the class teacher.'),
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
