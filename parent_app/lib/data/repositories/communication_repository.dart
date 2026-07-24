import '../api/api_client.dart';
import '../models/communication.dart';

class CommunicationRepository {
  CommunicationRepository(this._api);
  final ApiClient _api;
  String? _currentUserId;

  void setCurrentUserId(String? id) {
    _currentUserId = id;
  }

  Future<List<Announcement>> announcements() async {
    final data = await _api.get('/announcements');
    final rawList = (data is List)
        ? data
        : (data is Map<String, dynamic> && data['announcements'] is List
            ? data['announcements'] as List
            : <dynamic>[]);
    final list = rawList
        .whereType<Map<String, dynamic>>()
        .map(Announcement.fromJson)
        .toList()
      ..sort((a, b) {
        if (a.pinned != b.pinned) return a.pinned ? -1 : 1;
        return b.publishedAt.compareTo(a.publishedAt);
      });
    return list;
  }

  Future<List<MessageThread>> threadsFor(String parentId) async {
    final data = await _api.get(
      '/communication/threads',
      query: {'parentId': parentId},
    );
    final rawList = (data is List)
        ? data
        : (data is Map<String, dynamic> && data['threads'] is List
            ? data['threads'] as List
            : <dynamic>[]);
    return rawList
        .whereType<Map<String, dynamic>>()
        .map(MessageThread.fromJson)
        .toList()
      ..sort((a, b) {
        final ad = a.lastMessageAt ?? DateTime.fromMillisecondsSinceEpoch(0);
        final bd = b.lastMessageAt ?? DateTime.fromMillisecondsSinceEpoch(0);
        return bd.compareTo(ad);
      });
  }

  Future<MessageThread?> threadById(String id) async {
    try {
      final data = await _api.get('/communication/threads/$id/messages');
      if (data is Map<String, dynamic>) {
        return MessageThread.fromJson(data);
      }
    } catch (_) {}
    return null;
  }

  Future<List<ChatMessage>> messagesIn(String threadId) async {
    final data = await _api.get('/communication/threads/$threadId/messages');
    if (data is List) {
      return data
          .whereType<Map<String, dynamic>>()
          .map((j) => ChatMessage.fromJson(j, currentUserId: _currentUserId))
          .toList()
        ..sort((a, b) => a.sentAt.compareTo(b.sentAt));
    }
    return [];
  }

  Future<ChatMessage> sendMessage({
    required String threadId,
    required String parentId,
    required String content,
  }) async {
    final data = await _api.post(
      '/communication/threads/$threadId/messages',
      body: {'text': content},
    );
    if (data is Map<String, dynamic>) {
      return ChatMessage.fromJson(data, currentUserId: _currentUserId);
    }
    throw const ApiException('Invalid message response', code: 'invalid_response');
  }

  Future<List<ChatMessage>> optimisticSend({
    required String threadId,
    required String content,
    required String parentId,
  }) async {
    final now = DateTime.now();
    final temp = ChatMessage(
      id: 'tmp-${now.microsecondsSinceEpoch}',
      threadId: threadId,
      senderId: parentId,
      content: content,
      sentAt: now,
      fromParent: true,
      delivered: false,
    );
    return [temp];
  }
}

