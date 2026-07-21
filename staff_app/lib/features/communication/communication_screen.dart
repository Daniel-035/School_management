import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:staff_app/core/theme.dart';
import 'package:staff_app/data/school_repository.dart';

class CommunicationScreen extends StatelessWidget {
  const CommunicationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Communication'),
          bottom: const TabBar(
              indicatorColor: Colors.white,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white70,
              tabs: [
                Tab(icon: Icon(Icons.forum), text: 'Announcements'),
                Tab(icon: Icon(Icons.message), text: 'Messages')
              ]),
        ),
        body: const TabBarView(
            children: [_NoticeboardTab(), _DirectMessagesTab()]),
        floatingActionButton: Builder(builder: (ctx) {
          final tab = DefaultTabController.of(ctx).index;
          return FloatingActionButton.extended(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              onPressed: () =>
                  tab == 0 ? _showNoticeSheet(ctx) : _showMessageSheet(ctx),
              icon: const Icon(Icons.add),
              label: Text(tab == 0 ? 'Post' : 'Message'));
        }),
      ),
    );
  }

  static void _showNoticeSheet(BuildContext context) => showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _PostNoticeSheet());
  static void _showMessageSheet(BuildContext context) => showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _SendMessageSheet());
}

class _NoticeboardTab extends StatelessWidget {
  const _NoticeboardTab();
  @override
  Widget build(BuildContext context) {
    final repo = context.watch<SchoolRepository>();
    final posts = repo.noticeboard;
    if (posts.isEmpty) {
      return const Center(child: Text('No posts on the noticeboard.'));
    }
    return RefreshIndicator(
      onRefresh: repo.loadAll,
      child: ListView.separated(
        padding: const EdgeInsets.all(12),
        itemCount: posts.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          final post = posts[index];
          return Card(
            child: ListTile(
              leading: const CircleAvatar(
                  backgroundColor: AppColors.primary,
                  child: Icon(Icons.campaign, color: Colors.white, size: 18)),
              title: Text(post.title,
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                      '${post.body}${post.attachments.isEmpty ? '' : '\n${post.attachments.length} attachments'}')),
              trailing: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(post.className.isEmpty ? 'All' : post.className,
                        style: const TextStyle(
                            color: AppColors.textSecondary, fontSize: 11)),
                    Text(DateFormat('d MMM, HH:mm').format(post.postedAt),
                        style: const TextStyle(
                            color: AppColors.textSecondary, fontSize: 11))
                  ]),
            ),
          );
        },
      ),
    );
  }
}

class _DirectMessagesTab extends StatelessWidget {
  const _DirectMessagesTab();
  @override
  Widget build(BuildContext context) {
    final repo = context.watch<SchoolRepository>();
    final messages = repo.directMessages;
    return Column(children: [
      Container(
          color: AppColors.warning.withValues(alpha: 0.1),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: const Row(children: [
            Icon(Icons.shield_outlined, color: AppColors.warning, size: 18),
            SizedBox(width: 8),
            Expanded(
                child: Text(
                    'Direct messages are logged with read receipts and admin oversight.',
                    style:
                        TextStyle(fontSize: 12, color: AppColors.textPrimary)))
          ])),
      Expanded(
        child: RefreshIndicator(
          onRefresh: repo.loadAll,
          child: messages.isEmpty
              ? ListView(
                  padding: const EdgeInsets.only(top: 96),
                  children: const [Center(child: Text('No messages yet.'))])
              : ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: messages.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 6),
                  itemBuilder: (context, index) {
                    final message = messages[index];
                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(
                            backgroundColor:
                                AppColors.primary.withValues(alpha: 0.12),
                            child: Text(
                                message.parentName.isEmpty
                                    ? 'P'
                                    : message.parentName[0],
                                style: const TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.bold))),
                        title: Text(message.parentName,
                            style:
                                const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text(
                            'Re: ${message.studentName}\n${message.preview}${message.attachments.isEmpty ? '' : '\n${message.attachments.length} attachments'}',
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis),
                        isThreeLine: true,
                        trailing: Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(DateFormat('d MMM').format(message.sentAt),
                                  style: const TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 11)),
                              const SizedBox(height: 4),
                              _StatusChip(status: message.status),
                              if (message.unreadCount > 0)
                                Text('${message.unreadCount} unread',
                                    style: const TextStyle(
                                        fontSize: 10, color: AppColors.error))
                            ]),
                      ),
                    );
                  },
                ),
        ),
      ),
    ]);
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});
  @override
  Widget build(BuildContext context) {
    final color = status == 'Delivered' || status == 'Sent'
        ? AppColors.success
        : AppColors.warning;
    return Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(4)),
        child: Text(status,
            style: TextStyle(
                color: color, fontSize: 10, fontWeight: FontWeight.w700)));
  }
}

class _PostNoticeSheet extends StatefulWidget {
  const _PostNoticeSheet();
  @override
  State<_PostNoticeSheet> createState() => _PostNoticeSheetState();
}

class _PostNoticeSheetState extends State<_PostNoticeSheet> {
  final _title = TextEditingController();
  final _body = TextEditingController();
  String? _class;
  List<String> _attachments = [];

  @override
  void dispose() {
    _title.dispose();
    _body.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<SchoolRepository>();
    _class ??= repo.classNames.isNotEmpty ? repo.classNames.first : null;
    return _Sheet(
        child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
          const Text('Post Announcement',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          TextField(
              controller: _title,
              decoration: const InputDecoration(labelText: 'Title')),
          const SizedBox(height: 10),
          TextField(
              controller: _body,
              minLines: 3,
              maxLines: 6,
              decoration: const InputDecoration(labelText: 'Message')),
          const SizedBox(height: 10),
          DropdownButtonFormField<String>(
              initialValue: _class,
              decoration: const InputDecoration(labelText: 'Class'),
              items: repo.classNames
                  .map((item) =>
                      DropdownMenuItem(value: item, child: Text(item)))
                  .toList(),
              onChanged: (value) => setState(() => _class = value)),
          const SizedBox(height: 10),
          OutlinedButton.icon(
              onPressed: () async {
                final picked = await repo.pickAttachments();
                setState(() => _attachments = [..._attachments, ...picked]);
              },
              icon: const Icon(Icons.attach_file),
              label: Text(_attachments.isEmpty
                  ? 'Attach image/PDF'
                  : '${_attachments.length} attachments')),
          const SizedBox(height: 16),
          FilledButton.icon(
              onPressed: () async {
                if (_title.text.trim().isEmpty || _class == null) return;
                await repo.addNoticeboardPost(
                    title: _title.text.trim(),
                    body: _body.text.trim(),
                    className: _class!,
                    attachments: _attachments);
                if (context.mounted) Navigator.pop(context);
              },
              icon: const Icon(Icons.send),
              label: const Text('Post')),
        ]));
  }
}

class _SendMessageSheet extends StatefulWidget {
  const _SendMessageSheet();
  @override
  State<_SendMessageSheet> createState() => _SendMessageSheetState();
}

class _SendMessageSheetState extends State<_SendMessageSheet> {
  String? _studentId;
  bool _broadcast = false;
  String? _className;
  final _message = TextEditingController();
  List<String> _attachments = [];

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<SchoolRepository>();
    _studentId ??= repo.students.isNotEmpty ? repo.students.first.id : null;
    _className ??= repo.classNames.isNotEmpty ? repo.classNames.first : null;
    return _Sheet(
        child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
          const Text('Message Parents',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Broadcast to whole class'),
              value: _broadcast,
              onChanged: (value) => setState(() => _broadcast = value)),
          if (_broadcast)
            DropdownButtonFormField<String>(
                initialValue: _className,
                decoration: const InputDecoration(labelText: 'Class'),
                items: repo.classNames
                    .map((item) =>
                        DropdownMenuItem(value: item, child: Text(item)))
                    .toList(),
                onChanged: (value) => setState(() => _className = value))
          else
            DropdownButtonFormField<String>(
                initialValue: _studentId,
                decoration: const InputDecoration(labelText: 'Student'),
                items: repo.students
                    .map((item) => DropdownMenuItem(
                        value: item.id,
                        child: Text('${item.name} (${item.className})')))
                    .toList(),
                onChanged: (value) => setState(() => _studentId = value)),
          const SizedBox(height: 10),
          TextField(
              controller: _message,
              minLines: 3,
              maxLines: 6,
              decoration: const InputDecoration(labelText: 'Message')),
          const SizedBox(height: 10),
          OutlinedButton.icon(
              onPressed: () async {
                final picked = await repo.pickAttachments();
                setState(() => _attachments = [..._attachments, ...picked]);
              },
              icon: const Icon(Icons.attach_file),
              label: Text(_attachments.isEmpty
                  ? 'Attach image/PDF'
                  : '${_attachments.length} attachments')),
          const SizedBox(height: 16),
          FilledButton.icon(
              onPressed: () async {
                if (_message.text.trim().isEmpty) return;
                if (_broadcast && _className != null) {
                  await repo.broadcastToClass(
                      className: _className!,
                      message: _message.text.trim(),
                      attachments: _attachments);
                } else if (_studentId != null) {
                  final student =
                      repo.students.firstWhere((item) => item.id == _studentId);
                  await repo.sendDirectMessage(
                      parentName: 'Parent of ${student.name}',
                      studentName: student.name,
                      preview: _message.text.trim(),
                      attachments: _attachments);
                }
                if (context.mounted) Navigator.pop(context);
              },
              icon: const Icon(Icons.send),
              label: Text(_broadcast ? 'Broadcast' : 'Send')),
        ]));
  }
}

class _Sheet extends StatelessWidget {
  const _Sheet({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => Padding(
      padding:
          EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
          decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
          child: SingleChildScrollView(child: child)));
}
