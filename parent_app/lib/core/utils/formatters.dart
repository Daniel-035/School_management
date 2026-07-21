import 'package:intl/intl.dart';

class Formatters {
  Formatters._();

  static final DateFormat _date = DateFormat('d MMM yyyy');
  static final DateFormat _dateShort = DateFormat('d MMM');
  static final DateFormat _weekday = DateFormat('EEE, d MMM');
  static final DateFormat _time = DateFormat.jm();
  static final DateFormat _month = DateFormat('MMMM yyyy');

  static String date(DateTime d) => _date.format(d);
  static String dateShort(DateTime d) => _dateShort.format(d);
  static String weekday(DateTime d) => _weekday.format(d);
  static String time(DateTime d) => _time.format(d);
  static String month(DateTime d) => _month.format(d);

  static String dateRange(DateTime from, DateTime to) {
    if (from.year == to.year && from.month == to.month && from.day == to.day) {
      return date(from);
    }
    return '${dateShort(from)} → ${dateShort(to)}';
  }

  static String currency(num amount, {String code = 'INR'}) {
    final symbol = code == 'INR' ? '₹' : '$code ';
    final formatter = NumberFormat.currency(symbol: symbol, decimalDigits: 0);
    return formatter.format(amount);
  }

  static String percent(num value) => '${value.toStringAsFixed(0)}%';
}
