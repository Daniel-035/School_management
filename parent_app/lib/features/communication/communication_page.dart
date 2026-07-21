import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/communication.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/info_card.dart';
import '../../shared/widgets/status_pill.dart';
import 'announcement_detail_page.dart';
import 'chat_thread_page.dart';

class CommunicationPage extends ConsumerStatefulWidget {
  const CommunicationPage({super.key});
  @override
  ConsumerState<CommunicationPage> createState() => _CommunicationPageState();
}

class _CommunicationPageState extends ConsumerState<CommunicationPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 2, vsync: this);

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inbox'),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'Notices'),
            Tab(text: 'Messages'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: const [
          _AnnouncementsTab(),
          _MessagesTab(),
        ],
      ),
    );
  }
}

class _AnnouncementsTab extends ConsumerWidget {
  const _AnnouncementsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listAsync = ref.watch(announcementsProvider);
    final list = listAsync.valueOrNull ?? const <Announcement>[];
    if (list.isEmpty) {
      return RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(announcementsProvider);
          await Future<void>.delayed(const Duration(milliseconds: 300));
        },
        child: const EmptyState(
          icon: Icons.campaign_outlined,
          title: 'No announcements',
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(announcementsProvider);
        await Future<void>.delayed(const Duration(milliseconds: 300));
      },
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: list.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, i) => _AnnouncementTile(a: list[i]),
      ),
    );
  }
}

class _AnnouncementTile extends StatelessWidget {
  final Announcement a;
  const _AnnouncementTile({required this.a});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(
        builder: (_) => AnnouncementDetailPage(announcement: a),
      )),
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
                style: Theme.of(context)
                    .textTheme
                    .titleSmall
                    ?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 6),
            Text(a.body,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.person_outline_rounded,
                    size: 14,
                    color: Theme.of(context).colorScheme.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(a.authorName,
                    style: Theme.of(context).textTheme.bodySmall),
                const Spacer(),
                Wrap(
                  spacing: 4,
                  children: a.channels
                      .map((c) => Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Theme.of(context)
                                  .colorScheme
                                  .surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(c.toUpperCase(),
                                style: const TextStyle(
                                    fontSize: 10, fontWeight: FontWeight.w700)),
                          ))
                      .toList(),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MessagesTab extends ConsumerWidget {
  const _MessagesTab();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(authControllerProvider);
    final threadsAsync = ref.watch(threadsProvider);
    final threads = threadsAsync.valueOrNull ?? const <MessageThread>[];
    if (threads.isEmpty) {
      return RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(threadsProvider);
          await Future<void>.delayed(const Duration(milliseconds: 300));
        },
        child: const EmptyState(
          icon: Icons.chat_bubble_outline_rounded,
          title: 'No conversations yet',
          message: 'You can message your child\'s class teacher once assigned.',
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(threadsProvider);
        await Future<void>.delayed(const Duration(milliseconds: 300));
      },
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: threads.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) => _ThreadTile(thread: threads[i]),
      ),
    );
  }
}

class _ThreadTile extends StatelessWidget {
  final MessageThread thread;
  const _ThreadTile({required this.thread});
  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(
          builder: (_) => ChatThreadPage(thread: thread),
        )),
        child: InfoCard(
          child: Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                child: Text(
                  thread.teacherName.substring(0, 1),
                  style: TextStyle(
                      color: Theme.of(context).colorScheme.onPrimaryContainer,
                      fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(thread.teacherName,
                              style: const TextStyle(fontWeight: FontWeight.w700)),
                        ),
                        if (thread.lastMessageAt != null)
                          Text(Formatters.dateShort(thread.lastMessageAt!),
                              style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                    Text(thread.teacherSubject,
                        style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(height: 4),
                    Text(
                      thread.lastMessagePreview ?? '',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              if (thread.unreadCount > 0) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text('${thread.unreadCount}',
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.onPrimary,
                          fontSize: 12,
                          fontWeight: FontWeight.w700)),
                ),
              ]
            ],
          ),
        ),
      ),
    );
  }
}
