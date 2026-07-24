import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:staff_app/core/locale_controller.dart';
import 'package:staff_app/core/theme.dart';
import 'package:staff_app/data/models.dart';
import 'package:staff_app/data/school_repository.dart';
import 'package:staff_app/l10n/app_localizations.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final repo = context.watch<SchoolRepository>();
    final staff = repo.currentStaff;
    final assignedClasses = repo.classes
        .where((item) =>
            staff.assignedClassIds.isEmpty ||
            staff.assignedClassIds.contains(item.id))
        .toList();
    final assignedSubjects = repo.subjects
        .where((item) =>
            staff.assignedSubjectIds.isEmpty ||
            staff.assignedSubjectIds.contains(item.id))
        .toList();

    return Scaffold(
      appBar: AppBar(title: Text(l10n.profile)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _StaffProfileCard(staff: staff),
          const SizedBox(height: 12),
          const _ReadOnlyBanner(),
          const SizedBox(height: 16),
          _AssignmentSection(
            title: 'Assigned classes',
            icon: Icons.school_outlined,
            values: assignedClasses.map((item) => item.name).toList(),
            emptyLabel: 'All classes',
          ),
          const SizedBox(height: 12),
          _AssignmentSection(
            title: 'Assigned subjects',
            icon: Icons.menu_book_outlined,
            values: assignedSubjects.map((item) => item.name).toList(),
            emptyLabel: 'All subjects',
          ),
          const SizedBox(height: 12),
          _LanguageCard(),
          const SizedBox(height: 12),
          const _StaffChangePasswordCard(),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () async {
              await repo.logout();
            },
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.error,
              side: const BorderSide(color: AppColors.error),
              minimumSize: const Size.fromHeight(48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            icon: const Icon(Icons.logout_rounded),
            label: const Text('Sign out'),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Staff profile card (read-only details)
// ---------------------------------------------------------------------------

class _StaffProfileCard extends StatelessWidget {
  final StaffMember staff;
  const _StaffProfileCard({required this.staff});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 16),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: AppColors.primary,
                  backgroundImage: (staff.profilePicturePath != null && staff.profilePicturePath!.trim().isNotEmpty)
                      ? NetworkImage(staff.profilePicturePath!.trim())
                      : null,
                  onBackgroundImageError: (_, __) {},
                  child: (staff.profilePicturePath == null || staff.profilePicturePath!.trim().isEmpty)
                      ? Text(
                          staff.avatarInitial ??
                              (staff.name.isNotEmpty
                                  ? staff.name[0].toUpperCase()
                                  : '?'),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 22,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        staff.name,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: scheme.primaryContainer,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          staff.role,
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
                  value: staff.email.isEmpty ? '—' : staff.email,
                ),
                if (staff.phone != null && staff.phone!.isNotEmpty)
                  _DetailRow(
                    icon: Icons.phone_outlined,
                    label: 'Phone',
                    value: staff.phone!,
                  ),
                if (staff.username != null && staff.username!.isNotEmpty)
                  _DetailRow(
                    icon: Icons.person_outline_rounded,
                    label: 'Username',
                    value: staff.username!,
                  ),
                _DetailRow(
                  icon: Icons.badge_outlined,
                  label: 'Staff ID',
                  value: staff.id.isEmpty ? '—' : staff.id,
                ),
                if (staff.department != null && staff.department!.isNotEmpty)
                  _DetailRow(
                    icon: Icons.business_center_outlined,
                    label: 'Department',
                    value: staff.department!,
                  ),
                if (staff.dateOfBirth != null && staff.dateOfBirth!.isNotEmpty)
                  _DetailRow(
                    icon: Icons.cake_outlined,
                    label: 'Date of birth',
                    value: staff.dateOfBirth!,
                  ),
                if (staff.gender != null && staff.gender!.isNotEmpty)
                  _DetailRow(
                    icon: Icons.wc_rounded,
                    label: 'Gender',
                    value: staff.gender![0].toUpperCase() + staff.gender!.substring(1),
                  ),
                if (staff.address != null && staff.address!.isNotEmpty)
                  _DetailRow(
                    icon: Icons.location_on_outlined,
                    label: 'Address',
                    value: staff.address!,
                  ),
                _DetailRow(
                  icon: Icons.verified_user_outlined,
                  label: 'Account status',
                  value: _statusLabel(staff.status),
                  valueColor: staff.status == 'active'
                      ? AppColors.success
                      : AppColors.warning,
                ),
                if (staff.createdAt != null)
                  _DetailRow(
                    icon: Icons.calendar_today_outlined,
                    label: 'Member since',
                    value: _formatDate(staff.createdAt!),
                  ),
                if (staff.updatedAt != null)
                  _DetailRow(
                    icon: Icons.update_rounded,
                    label: 'Last updated',
                    value: _formatDate(staff.updatedAt!),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
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
        return status.isEmpty
            ? 'Unknown'
            : status[0].toUpperCase() + status.substring(1);
    }
  }

  String _formatDate(DateTime d) {
    return DateFormat('d MMM yyyy').format(d);
  }
}

// ---------------------------------------------------------------------------
// Read-only banner
// ---------------------------------------------------------------------------

class _ReadOnlyBanner extends StatelessWidget {
  const _ReadOnlyBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.border.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(10),
      ),
      child: const Row(
        children: [
          Icon(Icons.lock_outline_rounded,
              size: 18, color: AppColors.textSecondary),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'Profile details are managed by the school administration. '
              'Contact the school office to request changes.',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Assignment section (classes / subjects) - read-only
// ---------------------------------------------------------------------------

class _AssignmentSection extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<String> values;
  final String emptyLabel;
  const _AssignmentSection({
    required this.title,
    required this.icon,
    required this.values,
    required this.emptyLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 18, color: AppColors.primary),
                const SizedBox(width: 8),
                Text(title,
                    style: const TextStyle(fontWeight: FontWeight.w700)),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: values.isEmpty
                  ? [Chip(label: Text(emptyLabel))]
                  : values.map((item) => Chip(label: Text(item))).toList(),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Language preference card (app-level setting, not profile data)
// ---------------------------------------------------------------------------

class _LanguageCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.language_rounded,
                    size: 18, color: AppColors.primary),
                const SizedBox(width: 8),
                Text(l10n.language,
                    style: const TextStyle(fontWeight: FontWeight.w700)),
              ],
            ),
            const SizedBox(height: 10),
            Consumer<LocaleController>(builder: (context, localeController, _) {
              final code = localeController.locale?.languageCode ?? 'en';
              return SegmentedButton<String>(
                segments: [
                  ButtonSegment(value: 'en', label: Text(l10n.english)),
                  ButtonSegment(value: 'hi', label: Text(l10n.hindi))
                ],
                selected: {code},
                onSelectionChanged: (selection) =>
                    localeController.setLocale(Locale(selection.first)),
              );
            }),
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
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 10),
          Text(label, style: const TextStyle(color: AppColors.textPrimary)),
          const Spacer(),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: valueColor ?? AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Staff Change password card
// ---------------------------------------------------------------------------

class _StaffChangePasswordCard extends StatefulWidget {
  const _StaffChangePasswordCard();

  @override
  State<_StaffChangePasswordCard> createState() => _StaffChangePasswordCardState();
}

class _StaffChangePasswordCardState extends State<_StaffChangePasswordCard> {
  final _currentController = TextEditingController();
  final _newController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _loading = false;
  bool _showCurrent = false;
  bool _showNew = false;

  @override
  void dispose() {
    _currentController.dispose();
    _newController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final current = _currentController.text.trim();
    final newPass = _newController.text.trim();
    final confirm = _confirmController.text.trim();

    if (current.isEmpty || newPass.isEmpty || confirm.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all password fields')),
      );
      return;
    }
    if (newPass.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('New password must be at least 6 characters')),
      );
      return;
    }
    if (newPass != confirm) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('New passwords do not match')),
      );
      return;
    }

    setState(() => _loading = true);
    try {
      final repo = Provider.of<SchoolRepository>(context, listen: false);
      await repo.apiClient.post('/auth/change-password', body: {
        'currentPassword': current,
        'newPassword': newPass,
      });
      if (mounted) {
        _currentController.clear();
        _newController.clear();
        _confirmController.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password updated successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.lock_reset_rounded, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Change Password',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Use your temporary password generated by admin to update to a new password.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _currentController,
              obscureText: !_showCurrent,
              decoration: InputDecoration(
                labelText: 'Current / Temporary Password',
                isDense: true,
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  icon: Icon(_showCurrent ? Icons.visibility_off : Icons.visibility),
                  onPressed: () => setState(() => _showCurrent = !_showCurrent),
                ),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _newController,
              obscureText: !_showNew,
              decoration: InputDecoration(
                labelText: 'New Password',
                isDense: true,
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  icon: Icon(_showNew ? Icons.visibility_off : Icons.visibility),
                  onPressed: () => setState(() => _showNew = !_showNew),
                ),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _confirmController,
              obscureText: !_showNew,
              decoration: const InputDecoration(
                labelText: 'Confirm New Password',
                isDense: true,
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _loading ? null : _submit,
                icon: _loading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.check_circle_outline_rounded),
                label: Text(_loading ? 'Updating...' : 'Update Password'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
