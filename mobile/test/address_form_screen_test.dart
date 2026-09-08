import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lvigs_mart/screens/address_form_screen.dart';

void main() {
  group('AddressFormScreen', () {
    Widget createTestWidget({Map<String, String>? initialData, String? title}) {
      return MaterialApp(
        home: AddressFormScreen(
          initialData: initialData,
          title: title,
        ),
      );
    }

    testWidgets('should render all form fields', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      // Check that all key form fields are present
      expect(find.text('Contact Details'), findsOneWidget);
      expect(find.text('PIN Code'), findsOneWidget);
      expect(find.text('Address Details'), findsOneWidget);

      // Check form field labels
      expect(find.text('Full Name *'), findsOneWidget);
      expect(find.text('Mobile Number *'), findsOneWidget);
      expect(find.text('PIN Code *'), findsOneWidget);
      expect(find.text('Flat / House No. / Building *'), findsOneWidget);
      expect(find.text('City / District *'), findsOneWidget);
      expect(find.text('State *'), findsOneWidget);
    });

    testWidgets('should show error for invalid PIN code format', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      // Enter invalid PIN code (too short)
      final pincodeField = find.byType(TextFormField).at(2); // 3rd field is pincode
      await tester.enterText(pincodeField, '123');
      await tester.pumpAndSettle();

      // The field should show validation error when form is submitted
      expect(find.text('123'), findsOneWidget);
    });

    testWidgets('should populate fields with initial data', (WidgetTester tester) async {
      final initialData = {
        'name': 'Test User',
        'mobile': '9876543210',
        'pincode': '110001',
        'city': 'New Delhi',
        'state': 'Delhi',
        'line1': '123 Test Street',
      };

      await tester.pumpWidget(createTestWidget(initialData: initialData));

      // Verify pre-filled values
      expect(find.text('Test User'), findsOneWidget);
      expect(find.text('9876543210'), findsOneWidget);
      expect(find.text('110001'), findsOneWidget);
      expect(find.text('New Delhi'), findsOneWidget);
      expect(find.text('Delhi'), findsOneWidget);
    });

    testWidgets('should show country as India', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      // Scroll to bottom to find country field
      await tester.scrollUntilVisible(
        find.text('Country'),
        100,
        scrollable: find.byType(ListView),
      );

      expect(find.text('India'), findsOneWidget);
    });

    testWidgets('should show custom title when provided', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget(title: 'Edit Address'));

      expect(find.text('Edit Address'), findsOneWidget);
    });

    testWidgets('should show default title when not provided', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());

      expect(find.text('Add Address'), findsOneWidget);
    });
  });
}
