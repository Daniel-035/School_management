import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:staff_app/core/theme.dart';
import 'package:staff_app/data/school_repository.dart';
import 'package:staff_app/l10n/app_localizations.dart';

class NotificationTrayScreen extends StatelessWidget {
  const NotificationTrayScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final repo = context.watch<SchoolRepository>();
    final notifications = repo.notifications;
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.notifications),
        actions: [
          IconButton(
            tooltip: 'Mark all read',
            onPressed: repo.markNotificationsRead,
            icon: const Icon(Icons.done_all),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => repo.loadAll(),
        child: notifications.isEmpty
            ? ListView(
                padding: const EdgeInsets.only(top: 120),
                children: [Center(child: Text(l10n.emptyState))])
            : ListView.separated(
                padding: const EdgeInsets.all(12),
                itemCount: notifications.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final item = notifications[index];
                  return Semantics(
                    label: '${item.title}. ${item.body}',
                    child: Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor:
                              item.read ? AppColors.border : AppColors.primary,
                          child: Icon(
                              item.read
                                  ? Icons.notifications_none
                                  : Icons.notifications,
                              color: item.read
                                  ? AppColors.textSecondary
                                  : Colors.white),
                        ),
                        title: Text(item.title,
                            style: TextStyle(
                                fontWeight: item.read
                                    ? FontWeight.w500
                                    : FontWeight.w700)),
                        subtitle: Text(item.body),
                        trailing: Text(
                            DateFormat('d MMM\nHH:mm').format(item.createdAt),
                            textAlign: TextAlign.end,
                            style: const TextStyle(
                                fontSize: 11, color: AppColors.textSecondary)),
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
