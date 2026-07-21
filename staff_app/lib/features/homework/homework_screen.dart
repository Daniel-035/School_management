import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:staff_app/core/theme.dart';
import 'package:staff_app/data/school_repository.dart';

class HomeworkScreen extends StatelessWidget {
  const HomeworkScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<SchoolRepository>();
    final assignments = repo.assignments;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Homework & Assignments'),
      ),
      body: assignments.isEmpty
          ? const _Empty()
          : ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: assignments.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, i) {
                final a = assignments[i];
                final pct = a.total == 0
                    ? 0.0
                    : (a.submitted / a.total).clamp(0, 1).toDouble();
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                a.title,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            _DueChip(due: a.dueDate),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${a.subject} • Class ${a.className}',
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(a.description),
                        if (a.attachments.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: [
                              for (final f in a.attachments)
                                Chip(
                                  avatar: const Icon(
                                    Icons.attach_file,
                                    size: 14,
                                    color: AppColors.primary,
                                  ),
                                  label: Text(f),
                                  visualDensity: VisualDensity.compact,
                                ),
                            ],
                          ),
                        ],
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: LinearProgressIndicator(
                                value: pct,
                                minHeight: 6,
                                backgroundColor: AppColors.border,
                                color: AppColors.primary,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${a.submitted}/${a.total} submitted',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        onPressed: () => _showCreateSheet(context),
        icon: const Icon(Icons.add),
        label: const Text('New'),
      ),
    );
  }

  void _showCreateSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _CreateAssignmentSheet(),
    );
  }
}

class _DueChip extends StatelessWidget {
  final DateTime due;
  const _DueChip({required this.due});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final daysLeft = due.difference(now).inDays;
    Color bg;
    String text;
    if (daysLeft < 0) {
      bg = AppColors.absent.withValues(alpha: 0.12);
      text = 'Overdue';
    } else if (daysLeft == 0) {
      bg = AppColors.warning.withValues(alpha: 0.12);
      text = 'Due today';
    } else if (daysLeft <= 2) {
      bg = AppColors.warning.withValues(alpha: 0.12);
      text = 'In $daysLeft d';
    } else {
      bg = AppColors.primary.withValues(alpha: 0.08);
      text = 'Due ${DateFormat('d MMM').format(due)}';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration:
          BoxDecoration(color: bg, borderRadius: BorderRadius.circular(6)),
      child: Text(
        text,
        style: const TextStyle(
          color: AppColors.textPrimary,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _Empty extends StatelessWidget {
  const _Empty();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.assignment_outlined,
              size: 64, color: AppColors.textSecondary),
          SizedBox(height: 8),
          Text('No assignments yet'),
        ],
      ),
    );
  }
}

class _CreateAssignmentSheet extends StatefulWidget {
  const _CreateAssignmentSheet();

  @override
  State<_CreateAssignmentSheet> createState() => _CreateAssignmentSheetState();
}

class _CreateAssignmentSheetState extends State<_CreateAssignmentSheet> {
  final _title = TextEditingController();
  final _desc = TextEditingController();
  final _link = TextEditingController();
  String _subject = 'Mathematics';
  String _className = '6B';
  DateTime _due = DateTime.now().add(const Duration(days: 3));
  final _attachments = <String>[];

  @override
  void dispose() {
    _title.dispose();
    _desc.dispose();
    _link.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'New Assignment',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _title,
                decoration: const InputDecoration(labelText: 'Title'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _desc,
                minLines: 2,
                maxLines: 4,
                decoration: const InputDecoration(labelText: 'Description'),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _subject,
                      decoration: const InputDecoration(labelText: 'Subject'),
                      items: const [
                        'Mathematics',
                        'English',
                        'Science',
                        'Social Studies',
                        'Hindi',
                      ]
                          .map(
                              (s) => DropdownMenuItem(value: s, child: Text(s)))
                          .toList(),
                      onChanged: (v) => setState(() => _subject = v!),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _className,
                      decoration: const InputDecoration(labelText: 'Class'),
                      items: const ['6A', '6B', '7A', '7B']
                          .map(
                              (c) => DropdownMenuItem(value: c, child: Text(c)))
                          .toList(),
                      onChanged: (v) => setState(() => _className = v!),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              InkWell(
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 60)),
                    initialDate: _due,
                  );
                  if (picked != null) setState(() => _due = picked);
                },
                child: InputDecorator(
                  decoration: const InputDecoration(labelText: 'Due date'),
                  child: Text(DateFormat('EEE, d MMM yyyy').format(_due)),
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _link,
                      decoration: const InputDecoration(
                        labelText: 'Attachment link / filename',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: () {
                      final t = _link.text.trim();
                      if (t.isNotEmpty) {
                        setState(() {
                          _attachments.add(t);
                          _link.clear();
                        });
                      }
                    },
                    icon:
                        const Icon(Icons.add_circle, color: AppColors.primary),
                  ),
                ],
              ),
              if (_attachments.isNotEmpty) ...[
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  children: [
                    for (final a in _attachments)
                      InputChip(
                        label: Text(a),
                        onDeleted: () => setState(() => _attachments.remove(a)),
                      ),
                  ],
                ),
              ],
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () async {
                  if (_title.text.trim().isEmpty) return;
                  Navigator.pop(context);
                  final ok = await context.read<SchoolRepository>().addAssignment(
                        title: _title.text.trim(),
                        description: _desc.text.trim(),
                        className: _className,
                        subject: _subject,
                        dueDate: _due,
                        attachments: _attachments,
                      );
                  if (context.mounted) {
                    ScaffoldMessenger.maybeOf(context)?.showSnackBar(
                      SnackBar(
                        content: Text(ok ? 'Assignment posted' : 'Could not post assignment'),
                      ),
                    );
                  }
                },
                icon: const Icon(Icons.send),
                label: const Text('Assign'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
