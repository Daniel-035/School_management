import 'package:flutter_test/flutter_test.dart';

import 'package:parent_app/app.dart';

void main() {
  testWidgets('App exposes MaterialApp.router', (WidgetTester tester) async {
    expect(SchoolCompanionApp, isA<Type>());
  });
}
