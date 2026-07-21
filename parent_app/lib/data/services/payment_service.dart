import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../models/fees.dart';
import 'pdf_service.dart';

enum PaymentOutcome { success, cancelled, failure }

class PaymentResult {
  final PaymentOutcome outcome;
  final FeePayment? payment;
  final String? message;
  const PaymentResult(this.outcome, {this.payment, this.message});
}

class PaymentService {
  PaymentService({required this.pdfService});
  final PdfService pdfService;

  Future<PaymentResult> startPayment({
    required String studentName,
    required String studentEmail,
    required String studentPhone,
    required FeePayment payment,
    required String orderId,
    required int amountInPaise,
    required String description,
  }) async {
    final completer = Completer<PaymentResult>();
    final instance = Razorpay();
    instance.on(Razorpay.EVENT_PAYMENT_SUCCESS, (response) {
      if (!completer.isCompleted) {
        completer.complete(PaymentResult(
          PaymentOutcome.success,
          payment: payment,
        ));
      }
    });
    instance.on(Razorpay.EVENT_PAYMENT_ERROR, (PaymentFailureResponse response) {
      if (!completer.isCompleted) {
        completer.complete(PaymentResult(
          PaymentOutcome.failure,
          message: response.message?.toString() ?? 'Payment failed',
        ));
      }
    });
    instance.on(Razorpay.EVENT_EXTERNAL_WALLET, (ExternalWalletResponse response) {
      if (!completer.isCompleted) {
        completer.complete(const PaymentResult(
          PaymentOutcome.cancelled,
          message: 'External wallet selected',
        ));
      }
    });

    final options = <String, dynamic>{
      'key': 'rzp_test_dummy',
      'amount': amountInPaise,
      'name': 'School Companion',
      'description': description,
      'order_id': orderId,
      'prefill': <String, dynamic>{
        'name': studentName,
        'email': studentEmail,
        'contact': studentPhone,
      },
      'theme': <String, dynamic>{'color': '#1E5BB8'},
    };

    try {
      instance.open(options);
    } catch (e) {
      if (kDebugMode) {
        // ignore: avoid_print
        print('Razorpay open failed: $e');
      }
      instance.clear();
      return PaymentResult(PaymentOutcome.failure, message: e.toString());
    }

    final result = await completer.future;
    instance.clear();
    return result;
  }
}
