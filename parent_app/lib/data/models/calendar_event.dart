enum CalendarEventType { holiday, sportsDay, parentTeacherMeeting, exam, event, other }

CalendarEventType _typeFromString(String? s) {
  switch (s) {
    case 'holiday':
      return CalendarEventType.holiday;
    case 'sportsDay':
    case 'sports':
      return CalendarEventType.sportsDay;
    case 'parentTeacherMeeting':
    case 'ptm':
      return CalendarEventType.parentTeacherMeeting;
    case 'exam':
    case 'examination':
      return CalendarEventType.exam;
    case 'event':
      return CalendarEventType.event;
    default:
      return CalendarEventType.other;
  }
}

class SchoolEvent {
  final String id;
  final String title;
  final CalendarEventType type;
  final DateTime startDate;
  final DateTime? endDate;
  final String? description;
  final String? location;
  final String? startTimeLabel;
  final bool allDay;
  final String? classSectionId;

  const SchoolEvent({
    required this.id,
    required this.title,
    required this.type,
    required this.startDate,
    this.endDate,
    this.description,
    this.location,
    this.startTimeLabel,
    this.allDay = true,
    this.classSectionId,
  });

  factory SchoolEvent.fromJson(Map<String, dynamic> j) {
    return SchoolEvent(
      id: j['id'] as String,
      title: (j['title'] as String?) ?? '',
      type: _typeFromString(j['type'] as String?),
      startDate: DateTime.parse(j['date'] as String),
      description: j['description'] as String?,
    );
  }
}
