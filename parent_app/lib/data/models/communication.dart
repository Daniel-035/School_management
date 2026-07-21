class Announcement {
  final String id;
  final String title;
  final String body;
  final DateTime publishedAt;
  final String authorId;
  final String authorName;
  final List<String> audience;
  final List<String> channels;
  final bool pinned;

  const Announcement({
    required this.id,
    required this.title,
    required this.body,
    required this.publishedAt,
    required this.authorName,
    this.authorId = '',
    this.audience = const [],
    this.channels = const ['push'],
    this.pinned = false,
  });

  factory Announcement.fromJson(Map<String, dynamic> j) {
    final published = j['publishedAt'] as String?;
    return Announcement(
      id: j['id'] as String,
      title: (j['title'] as String?) ?? '',
      body: (j['body'] as String?) ?? '',
      publishedAt: published != null
          ? DateTime.tryParse(published) ?? DateTime.now()
          : DateTime.now(),
      authorId: (j['authorId'] as String?) ?? '',
      authorName: (j['authorName'] as String?) ?? '',
      audience: (j['audience'] as List?)?.whereType<String>().toList() ??
          const [],
      channels: (j['channels'] as List?)?.whereType<String>().toList() ??
          const ['push'],
      pinned: (j['pinned'] as bool?) ?? false,
    );
  }
}

class MessageThread {
  final String id;
  final String parentId;
  final String teacherId;
  final String teacherName;
  final String teacherSubject;
  final String? studentId;
  final DateTime? lastMessageAt;
  final String? lastMessagePreview;
  final int unreadCount;
  final bool schoolHoursOnly;

  const MessageThread({
    required this.id,
    required this.parentId,
    required this.teacherId,
    required this.teacherName,
    required this.teacherSubject,
    this.studentId,
    this.lastMessageAt,
    this.lastMessagePreview,
    this.unreadCount = 0,
    this.schoolHoursOnly = true,
  });

  factory MessageThread.fromJson(Map<String, dynamic> j) {
    final lastAt = j['lastMessageAt'] as String?;
    return MessageThread(
      id: j['id'] as String,
      parentId: (j['parentId'] as String?) ?? '',
      teacherId: (j['teacherId'] as String?) ?? '',
      teacherName: (j['teacherName'] as String?) ?? '',
      teacherSubject: (j['teacherSubject'] as String?) ?? '',
      studentId: j['studentId'] as String?,
      lastMessageAt: lastAt != null ? DateTime.tryParse(lastAt) : null,
      lastMessagePreview: j['lastMessagePreview'] as String?,
      unreadCount: ((j['unreadCount'] as num?) ?? 0).toInt(),
    );
  }
}

class ChatMessage {
  final String id;
  final String threadId;
  final String senderId;
  final String content;
  final DateTime sentAt;
  final bool fromParent;
  final bool delivered;
  final bool read;

  const ChatMessage({
    required this.id,
    required this.threadId,
    required this.senderId,
    required this.content,
    required this.sentAt,
    required this.fromParent,
    this.delivered = true,
    this.read = false,
  });

  factory ChatMessage.fromJson(
    Map<String, dynamic> j, {
    String? currentUserId,
  }) {
    final senderId = (j['senderId'] as String?) ?? '';
    final sentAt = j['sentAt'] as String?;
    return ChatMessage(
      id: j['id'] as String,
      threadId: (j['threadId'] as String?) ?? '',
      senderId: senderId,
      content: (j['text'] as String?) ?? '',
      sentAt: sentAt != null
          ? DateTime.tryParse(sentAt) ?? DateTime.now()
          : DateTime.now(),
      fromParent: currentUserId != null && senderId == currentUserId,
    );
  }
}
