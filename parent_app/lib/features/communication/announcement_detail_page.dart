import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';

import '../../core/utils/formatters.dart';
import '../../data/models/communication.dart';
import '../../shared/widgets/info_card.dart';
import '../../shared/widgets/status_pill.dart';

class AnnouncementDetailPage extends StatelessWidget {
  final Announcement announcement;
  const AnnouncementDetailPage({super.key, required this.announcement});

  @override
  Widget build(BuildContext context) {
    final a = announcement;
    return Scaffold(
      appBar: AppBar(title: const Text('Announcement')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (a.pinned)
            const Padding(
              padding: EdgeInsets.only(bottom: 8),
              child: StatusPill(
                label: 'Pinned by school',
                color: AppColors.warning,
                icon: Icons.push_pin_rounded,
              ),
            ),
          Text(a.title,
              style: Theme.of(context)
                  .textTheme
                  .headlineSmall
                  ?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.person_outline_rounded, size: 16),
              const SizedBox(width: 4),
              Text(a.authorName, style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(width: 12),
              const Icon(Icons.event_rounded, size: 16),
              const SizedBox(width: 4),
              Text(Formatters.date(a.publishedAt),
                  style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
          const SizedBox(height: 12),
          if (a.audience.isNotEmpty)
            Wrap(
              spacing: 6,
              children: [
                StatusPill(
                  label: 'For: ${a.audience.join(', ')}',
                  color: Theme.of(context).colorScheme.primary,
                ),
                for (final c in a.channels)
                  StatusPill(
                    label: c.toUpperCase(),
                    color: Theme.of(context).colorScheme.tertiary,
                  ),
              ],
            ),
          const SizedBox(height: 16),
          InfoCard(
            child: Text(a.body, style: Theme.of(context).textTheme.bodyLarge),
          ),
        ],
      ),
    );
  }
}
