import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/login_page.dart';
import '../../features/auth/onboarding_page.dart';
import '../../features/notifications/notifications_page.dart';
import '../../features/calendar/calendar_page.dart';
import '../../features/communication/announcement_detail_page.dart';
import '../../features/communication/chat_thread_page.dart';
import '../../features/profile/profile_page.dart';
import '../../features/shell/home_shell.dart';
import '../providers.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<int>(0);
  ref.listen(authControllerProvider, (_, __) => refresh.value++);
  ref.listen(onboardingControllerProvider, (_, __) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final authed = auth.valueOrNull != null;
      final onboarded = ref.read(onboardingControllerProvider);
      final loc = state.matchedLocation;
      if (auth.isLoading) return null;
      if (!onboarded && loc != '/welcome') return '/welcome';
      if (onboarded && loc == '/welcome') return '/';
      if (!authed && loc != '/login' && loc != '/welcome') return '/login';
      if (authed && loc == '/login') return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/welcome', builder: (_, __) => const OnboardingPage()),
      GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
      GoRoute(
        path: '/',
        builder: (_, state) {
          final tab =
              int.tryParse(state.uri.queryParameters['tab'] ?? '0') ?? 0;
          return HomeShell(initialIndex: tab.clamp(0, 4));
        },
        routes: [
          GoRoute(path: 'profile', builder: (_, __) => const ProfilePage()),
          GoRoute(path: 'calendar', builder: (_, __) => const CalendarPage()),
          GoRoute(
            path: 'notifications',
            builder: (_, __) => const NotificationsPage(),
          ),
        ],
      ),
      GoRoute(
        path: '/thread',
        builder: (_, state) {
          final id = state.uri.queryParameters['id'];
          if (id == null) return const _MissingRoute();
          return ChatThreadRoute(threadId: id);
        },
      ),
      GoRoute(
        path: '/announcement',
        builder: (_, state) {
          final id = state.uri.queryParameters['id'];
          if (id == null) return const _MissingRoute();
          return AnnouncementRoute(id: id);
        },
      ),
    ],
  );
});

class _MissingRoute extends StatelessWidget {
  const _MissingRoute();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: const Center(child: Text('Item not found')),
    );
  }
}

class ChatThreadRoute extends ConsumerWidget {
  const ChatThreadRoute({super.key, required this.threadId});
  final String threadId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final threads = ref.watch(threadsProvider);
    return threads.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: Center(child: Text('Couldn\'t open conversation. $e')),
      ),
      data: (list) {
        final thread = list.where((t) => t.id == threadId).toList();
        if (thread.isEmpty) {
          return const Scaffold(body: Center(child: Text('Conversation not found')));
        }
        return ChatThreadPage(thread: thread.first);
      },
    );
  }
}

class AnnouncementRoute extends ConsumerWidget {
  const AnnouncementRoute({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(announcementsProvider);
    return list.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: Center(child: Text('Couldn\'t open notice. $e')),
      ),
      data: (items) {
        final match = items.where((a) => a.id == id).toList();
        if (match.isEmpty) {
          return const Scaffold(body: Center(child: Text('Notice not found')));
        }
        return AnnouncementDetailPage(announcement: match.first);
      },
    );
  }
}
