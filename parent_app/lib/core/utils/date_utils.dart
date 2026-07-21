extension DateTimeOnly on DateTime {
  DateTime get atMidnight => DateTime(year, month, day);

  bool sameDay(DateTime other) =>
      year == other.year && month == other.month && day == other.day;

  bool isToday() => sameDay(DateTime.now());

  bool isYesterday() => sameDay(DateTime.now().subtract(const Duration(days: 1)));
}

class DateRanges {
  DateRanges._();

  static DateTime startOfMonth(DateTime d) => DateTime(d.year, d.month, 1);

  static DateTime endOfMonth(DateTime d) =>
      DateTime(d.year, d.month + 1, 0, 23, 59, 59);

  static int daysBetween(DateTime from, DateTime to) {
    final f = from.atMidnight;
    final t = to.atMidnight;
    return t.difference(f).inDays + 1;
  }
}
