import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../core/utils/formatters.dart';

class NotificationsPage extends ConsumerWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(unreadNotificationCountProvider);
    final store = ref.watch(notificationStoreProvider);
    final items = store.all;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          IconButton(
            tooltip: 'Mark all read',
            onPressed: () async {
              await store.markAllRead();
            },
            icon: const Icon(Icons.done_all_rounded),
          ),
        ],
      ),
      body: items.isEmpty
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.notifications_off_rounded, size: 48),
                    SizedBox(height: 12),
                    Text(
                      'No notifications yet',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final n = items[i];
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: n.read
                          ? Theme.of(context).colorScheme.surfaceContainerHighest
                          : Theme.of(context).colorScheme.primaryContainer,
                      child: Icon(
                        _iconFor(n.type),
                        color: n.read
                            ? Theme.of(context).colorScheme.onSurfaceVariant
                            : Theme.of(context).colorScheme.onPrimaryContainer,
                      ),
                    ),
                    title: Text(
                      n.title,
                      style: TextStyle(
                        fontWeight: n.read ? FontWeight.w500 : FontWeight.w700,
                      ),
                    ),
                    subtitle: Text(
                      n.body,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    trailing: Text(Formatters.dateShort(n.receivedAt),
                        style: Theme.of(context).textTheme.bodySmall),
                    onTap: () {
                      final link = n.deepLink;
                      if (link == null) return;
                      if (link.startsWith('/thread') || link.startsWith('/announcement')) {
                        context.push(link);
                      }
                    },
                  ),
                );
              },
            ),
    );
  }

  IconData _iconFor(String? type) {
    switch (type) {
      case 'message':
        return Icons.chat_bubble_rounded;
      case 'attendance':
        return Icons.event_available_rounded;
      case 'fees':
        return Icons.account_balance_wallet_rounded;
      case 'announcement':
      default:
        return Icons.campaign_rounded;
    }
  }
}
