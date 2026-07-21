import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/app_constants.dart';
import '../../core/providers.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/student.dart';
import '../../data/models/user.dart';
import '../../shared/widgets/child_avatar.dart';
import '../../shared/widgets/info_card.dart';

const String kSupportEmail = 'support@schoolcompanion.app';
const String kPrivacyPolicyUrl = 'https://schoolcompanion.app/privacy';
const String kTermsUrl = 'https://schoolcompanion.app/terms';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final parentAsync = ref.watch(authControllerProvider);
    final childrenAsync = ref.watch(linkedChildrenProvider);
    final selectedId = ref.watch(selectedChildIdProvider);
    final themeMode = ref.watch(themeControllerProvider);
    final locale = ref.watch(localeControllerProvider);

    final parent = parentAsync.valueOrNull;
    if (parent == null) return const SizedBox.shrink();
    final children = childrenAsync.valueOrNull ?? const <Student>[];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        leading: BackButton(onPressed: () => context.go('/')),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _ParentProfileCard(parent: parent),
          const SizedBox(height: 16),
          const _ReadOnlyBanner(),
          const SizedBox(height: 16),
          Row(
            children: [
              Text('Linked children',
                  style: Theme.of(context)
                      .textTheme
                      .titleSmall
                      ?.copyWith(fontWeight: FontWeight.w700)),
              const Spacer(),
              Text('${children.length} ${children.length == 1 ? "child" : "children"}',
                  style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
          const SizedBox(height: 8),
          if (childrenAsync.isLoading)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (children.isEmpty)
            const _EmptyChildren()
          else
            for (final c in children)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _ChildDetailCard(
                  student: c,
                  active: c.id == selectedId,
                  onTap: () {
                    ref.read(selectedChildIdProvider.notifier).set(c.id);
                    context.go('/');
                  },
                ),
              ),
          const SizedBox(height: 8),
          const _SectionLabel('Preferences'),
          _SettingsCard(
            children: [
              _SettingsRow(
                icon: Icons.dark_mode_outlined,
                title: 'Dark mode',
                trailing: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 180),
                  child: SegmentedButton<ThemeMode>(
                    segments: const [
                      ButtonSegment(
                          value: ThemeMode.system,
                          icon: Icon(Icons.brightness_auto_rounded)),
                      ButtonSegment(
                          value: ThemeMode.light,
                          icon: Icon(Icons.light_mode_rounded)),
                      ButtonSegment(
                          value: ThemeMode.dark,
                          icon: Icon(Icons.dark_mode_rounded)),
                    ],
                    selected: {themeMode},
                    onSelectionChanged: (value) {
                      ref
                          .read(themeControllerProvider.notifier)
                          .set(value.first);
                    },
                  ),
                ),
              ),
              _SettingsRow(
                icon: Icons.language_rounded,
                title: 'Language',
                trailing: SizedBox(
                  width: 120,
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<Locale?>(
                      value: locale,
                      isDense: true,
                      items: const [
                        DropdownMenuItem(
                            value: null, child: Text('System')),
                        DropdownMenuItem(
                            value: Locale('en'), child: Text('English')),
                        DropdownMenuItem(
                            value: Locale('hi'), child: Text('हिन्दी')),
                      ],
                      onChanged: (value) =>
                          ref.read(localeControllerProvider.notifier).set(value),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const _SectionLabel('Help & support'),
          _SettingsCard(
            children: [
              _SettingsRow(
                icon: Icons.email_outlined,
                title: 'Contact support',
                subtitle: kSupportEmail,
                onTap: () => launchUrl(Uri(
                  scheme: 'mailto',
                  path: kSupportEmail,
                  query: 'subject=Help with School Companion',
                )),
              ),
              _SettingsRow(
                icon: Icons.privacy_tip_outlined,
                title: 'Privacy policy',
                onTap: () => launchUrl(Uri.parse(kPrivacyPolicyUrl),
                    mode: LaunchMode.externalApplication),
              ),
              _SettingsRow(
                icon: Icons.gavel_rounded,
                title: 'Terms of use',
                onTap: () => launchUrl(Uri.parse(kTermsUrl),
                    mode: LaunchMode.externalApplication),
              ),
            ],
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
            icon: const Icon(Icons.logout_rounded),
            label: const Text('Sign out'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.danger,
              side: const BorderSide(color: AppColors.danger),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Parent profile card
// ---------------------------------------------------------------------------

class _ParentProfileCard extends StatelessWidget {
  final AppUser parent;
  const _ParentProfileCard({required this.parent});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return InfoCard(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 16),
            child: Row(
              children: [
                ChildAvatar(initials: _initials(parent.name), size: 64),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(parent.name,
                          style: Theme.of(context)
                              .textTheme
                              .titleLarge
                              ?.copyWith(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: scheme.primaryContainer,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          _roleLabel(parent.role),
                          style: TextStyle(
                            color: scheme.onPrimaryContainer,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              children: [
                _DetailRow(
                  icon: Icons.alternate_email_rounded,
                  label: 'Email',
                  value: parent.email,
                ),
                if (parent.phone != null && parent.phone!.isNotEmpty)
                  _DetailRow(
                    icon: Icons.phone_outlined,
                    label: 'Phone',
                    value: parent.phone!,
                  ),
                _DetailRow(
                  icon: Icons.verified_user_outlined,
                  label: 'Account status',
                  value: _statusLabel(parent.status),
                  valueColor: parent.status == 'active'
                      ? AppColors.positive
                      : AppColors.warning,
                ),
                _DetailRow(
                  icon: Icons.calendar_today_outlined,
                  label: 'Member since',
                  value: Formatters.date(parent.createdAt),
                ),
                _DetailRow(
                  icon: Icons.update_rounded,
                  label: 'Last updated',
                  value: Formatters.date(parent.updatedAt),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _roleLabel(UserRole role) {
    switch (role) {
      case UserRole.admin:
        return 'Administrator';
      case UserRole.staff:
        return 'Staff';
      case UserRole.teacher:
        return 'Teacher';
      case UserRole.parent:
        return 'Parent';
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'active':
        return 'Active';
      case 'suspended':
        return 'Suspended';
      case 'invited':
        return 'Invited';
      default:
        return status[0].toUpperCase() + status.substring(1);
    }
  }

  String _initials(String name) {
    final parts = name.trim().split(' ').where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts.last.substring(0, 1))
        .toUpperCase();
  }
}

// ---------------------------------------------------------------------------
// Read-only banner
// ---------------------------------------------------------------------------

class _ReadOnlyBanner extends StatelessWidget {
  const _ReadOnlyBanner();

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(Icons.lock_outline_rounded,
              size: 18, color: scheme.onSurfaceVariant),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Profile details are managed by the school. '
              'Contact the school office to request changes.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: scheme.onSurfaceVariant,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Child detail card (expandable, read-only)
// ---------------------------------------------------------------------------

class _ChildDetailCard extends StatefulWidget {
  final Student student;
  final bool active;
  final VoidCallback onTap;
  const _ChildDetailCard({
    required this.student,
    required this.active,
    required this.onTap,
  });

  @override
  State<_ChildDetailCard> createState() => _ChildDetailCardState();
}

class _ChildDetailCardState extends State<_ChildDetailCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final s = widget.student;
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: widget.onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  ChildAvatar(initials: s.initials, size: 48),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(s.name,
                            style: const TextStyle(
                                fontWeight: FontWeight.w700, fontSize: 15)),
                        const SizedBox(height: 2),
                        Text(
                          '${s.classSection.label} · Roll ${s.rollNumber}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  if (widget.active)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: scheme.primaryContainer,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        'Selected',
                        style: TextStyle(
                          color: scheme.onPrimaryContainer,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  IconButton(
                    icon: Icon(
                      _expanded
                          ? Icons.expand_less_rounded
                          : Icons.expand_more_rounded,
                    ),
                    onPressed: () =>
                        setState(() => _expanded = !_expanded),
                    tooltip: _expanded ? 'Show less' : 'Show details',
                  ),
                ],
              ),
              AnimatedCrossFade(
                duration: const Duration(milliseconds: 200),
                crossFadeState: _expanded
                    ? CrossFadeState.showSecond
                    : CrossFadeState.showFirst,
                firstChild: const SizedBox.shrink(),
                secondChild: Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Column(
                    children: [
                      const Divider(height: 1),
                      const SizedBox(height: 8),
                      _DetailRow(
                        icon: Icons.badge_outlined,
                        label: 'Student ID',
                        value: s.id,
                      ),
                      _DetailRow(
                        icon: Icons.school_rounded,
                        label: 'Class',
                        value: s.classSection.label,
                      ),
                      _DetailRow(
                        icon: Icons.format_list_numbered_rounded,
                        label: 'Roll number',
                        value: s.rollNumber.isEmpty ? '—' : s.rollNumber,
                      ),
                      if (s.dateOfBirth != null)
                        _DetailRow(
                          icon: Icons.cake_outlined,
                          label: 'Date of birth',
                          value: Formatters.date(s.dateOfBirth!),
                        ),
                      _DetailRow(
                        icon: Icons.how_to_reg_rounded,
                        label: 'Status',
                        value: _studentStatusLabel(s.status),
                        valueColor: s.status == 'active'
                            ? AppColors.positive
                            : AppColors.warning,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _studentStatusLabel(String status) {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'graduated':
        return 'Graduated';
      case 'transferred':
        return 'Transferred';
      default:
        return status[0].toUpperCase() + status.substring(1);
    }
  }
}

// ---------------------------------------------------------------------------
// Empty children state
// ---------------------------------------------------------------------------

class _EmptyChildren extends StatelessWidget {
  const _EmptyChildren();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Icon(Icons.person_off_rounded,
                size: 40, color: Theme.of(context).colorScheme.outline),
            const SizedBox(height: 12),
            Text('No children linked',
                style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 4),
            Text(
              'Please contact the school office to link a child to your account.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Detail row (read-only key-value)
// ---------------------------------------------------------------------------

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: scheme.onSurfaceVariant),
          const SizedBox(width: 10),
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          const Spacer(),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: valueColor,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Shared widgets (unchanged from original)
// ---------------------------------------------------------------------------

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 8, 4, 6),
      child: Text(text,
          style: Theme.of(context)
              .textTheme
              .titleSmall
              ?.copyWith(fontWeight: FontWeight.w700)),
    );
  }
}

class _SettingsCard extends StatelessWidget {
  final List<Widget> children;
  const _SettingsCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            children[i],
            if (i != children.length - 1) const Divider(height: 1),
          ],
        ],
      ),
    );
  }
}

class _SettingsRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  const _SettingsRow({
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: subtitle == null ? null : Text(subtitle!),
      trailing: trailing ??
          (onTap != null ? const Icon(Icons.chevron_right_rounded) : null),
      onTap: onTap,
    );
  }
}
