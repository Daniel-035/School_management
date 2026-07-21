import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../core/constants/app_constants.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/communication.dart';

class ChatThreadPage extends ConsumerStatefulWidget {
  final MessageThread thread;
  const ChatThreadPage({super.key, required this.thread});
  @override
  ConsumerState<ChatThreadPage> createState() => _ChatThreadPageState();
}

class _ChatThreadPageState extends ConsumerState<ChatThreadPage> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  bool _sending = false;
  List<ChatMessage>? _optimistic;

  @override
  void dispose() {
    _ctrl.dispose();
    _scroll.dispose();
    super.dispose();
  }

  bool _withinSchoolHours() {
    if (!widget.thread.schoolHoursOnly) return true;
    final now = DateTime.now();
    if (now.weekday == DateTime.sunday) return false;
    const start = 8; // 8:00 AM
    const end = 17; // 5:00 PM
    return now.hour >= start && now.hour < end;
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    if (!_withinSchoolHours()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
              'Messaging is available only during school hours (Mon–Sat, 8 AM–5 PM).'),
        ),
      );
      return;
    }
    setState(() {
      _sending = true;
      _optimistic = [
        ...?_optimistic,
        ChatMessage(
          id: 'tmp-${DateTime.now().microsecondsSinceEpoch}',
          threadId: widget.thread.id,
          senderId: ref.read(authControllerProvider).valueOrNull?.id ?? '',
          content: text,
          sentAt: DateTime.now(),
          fromParent: true,
          delivered: false,
        ),
      ];
      _ctrl.clear();
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: AppConstants.mediumAnim,
          curve: Curves.easeOut,
        );
      }
    });
    final parent = ref.read(authControllerProvider).valueOrNull;
    if (parent == null) {
      if (mounted) setState(() => _sending = false);
      return;
    }
    try {
      await ref.read(communicationRepositoryProvider).sendMessage(
            threadId: widget.thread.id,
            parentId: parent.id,
            content: text,
          );
      if (mounted) {
        setState(() => _optimistic = null);
      }
      ref.invalidate(messagesProvider(widget.thread.id));
    } catch (_) {
      if (mounted) {
        setState(() {
          _optimistic = null;
          _ctrl.text = text;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Couldn\'t send. Try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canSend = _withinSchoolHours();
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.thread.teacherName,
                style: const TextStyle(fontSize: 16)),
            Text(widget.thread.teacherSubject,
                style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
      body: Column(
        children: [
          if (!canSend)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              color: AppColors.warning.withValues(alpha: 0.12),
              child: const Row(
                children: [
                  Icon(Icons.access_time_rounded,
                      size: 16, color: AppColors.warning),
                  SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Outside school hours. Messages will be delivered when school reopens.',
                      style: TextStyle(fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          Expanded(
            child: Builder(builder: (context) {
              final base = ref.watch(messagesProvider(widget.thread.id)).valueOrNull ?? const <ChatMessage>[];
              final all = _optimistic == null ? base : [...base, ..._optimistic!];
              return ListView.builder(
                controller: _scroll,
                padding: const EdgeInsets.all(12),
                itemCount: all.length,
                itemBuilder: (_, i) => _Bubble(message: all[i]),
              );
            }),
          ),
          SafeArea(
            top: false,
            child: Container(
              padding: const EdgeInsets.fromLTRB(12, 6, 12, 10),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                border: Border(
                    top: BorderSide(color: Theme.of(context).dividerColor)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _ctrl,
                      minLines: 1,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        hintText: 'Type a message',
                      ),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: (_sending || !canSend) ? null : _send,
                    icon: _sending
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(
                                strokeWidth: 2.2, color: Colors.white),
                          )
                        : const Icon(Icons.send_rounded),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  final ChatMessage message;
  const _Bubble({required this.message});
  @override
  Widget build(BuildContext context) {
    final fromParent = message.fromParent;
    final scheme = Theme.of(context).colorScheme;
    final bg = fromParent ? scheme.primary : scheme.surfaceContainerHighest;
    final fg = fromParent ? scheme.onPrimary : scheme.onSurface;
    return Align(
      alignment: fromParent ? Alignment.centerRight : Alignment.centerLeft,
      child: ConstrainedBox(
        constraints:
            BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.78),
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 4),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(14),
              topRight: const Radius.circular(14),
              bottomLeft: Radius.circular(fromParent ? 14 : 4),
              bottomRight: Radius.circular(fromParent ? 4 : 14),
            ),
          ),
          child: Column(
            crossAxisAlignment:
                fromParent ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              Text(message.content, style: TextStyle(color: fg)),
              const SizedBox(height: 2),
              Text(Formatters.time(message.sentAt),
                  style: TextStyle(
                      color: fg.withValues(alpha: 0.7), fontSize: 10)),
            ],
          ),
        ),
      ),
    );
  }
}
