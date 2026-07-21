import '../../core/utils/date_utils.dart';
import '../api/api_client.dart';
import '../models/calendar_event.dart';

class CalendarRepository {
  CalendarRepository(this._api);
  final ApiClient _api;

  Future<List<SchoolEvent>> all() async {
    final data = await _api.get('/events');
    if (data is List) {
      return data
          .whereType<Map<String, dynamic>>()
          .map(SchoolEvent.fromJson)
          .toList()
        ..sort((a, b) => a.startDate.compareTo(b.startDate));
    }
    return [];
  }

  Future<List<SchoolEvent>> upcoming({int limit = 10}) async {
    final today = DateTime.now().atMidnight;
    final all = await this.all();
    final list = all.where((e) {
      final end = e.endDate ?? e.startDate;
      return !end.isBefore(today);
    }).toList();
    return list.take(limit).toList();
  }
}
