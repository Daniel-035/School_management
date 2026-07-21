import 'package:add_2_calendar/add_2_calendar.dart';

import '../../data/models/calendar_event.dart';

class CalendarAddService {
  CalendarAddService();

  Future<bool> addEvent(SchoolEvent event) async {
    final end = event.endDate ?? event.startDate;
    final allDay = event.allDay;
    final start = allDay ? event.startDate : event.startDate;
    final endDate = allDay ? end : end;
    final event2Cal = Event(
      title: event.title,
      description: event.description ?? '',
      location: event.location ?? '',
      startDate: start,
      endDate: endDate,
      allDay: allDay,
    );
    return Add2Calendar.addEvent2Cal(event2Cal);
  }
}
