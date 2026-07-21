import 'dart:async';

import '../api/api_client.dart';
import '../models/fees.dart';

class RazorpayOrder {
  final String orderId;
  final int amountInPaise;
  final String currency;
  const RazorpayOrder({
    required this.orderId,
    required this.amountInPaise,
    required this.currency,
  });
}

class PaymentRepository {
  PaymentRepository(this._api);
  final ApiClient _api;

  Future<RazorpayOrder?> createOrder({
    required String studentId,
    required String feeStructureId,
    required double amount,
  }) async {
    try {
      final data = await _api.post(
        '/fees/payments/orders',
        body: {
          'studentId': studentId,
          'feeStructureId': feeStructureId,
          'amount': amount,
          'gateway': 'razorpay',
        },
      ) as Map<String, dynamic>;
      return RazorpayOrder(
        orderId: data['orderId'] as String,
        amountInPaise: ((data['amount'] as num?) ?? 0).toInt(),
        currency: (data['currency'] as String?) ?? 'INR',
      );
    } on ApiException {
      return null;
    }
  }

  Future<FeePayment> verifyPayment({
    required String paymentId,
    required String orderId,
    required String signature,
    required String gateway,
  }) async {
    final data = await _api.post(
      '/fees/payments/verify',
      body: {
        'paymentId': paymentId,
        'orderId': orderId,
        'signature': signature,
        'gateway': gateway,
      },
    ) as Map<String, dynamic>;
    return FeePayment.fromJson(data);
  }

  Future<FeePayment> recordManual({
    required String paymentId,
    required String method,
    required double amount,
  }) async {
    final data = await _api.post(
      '/fees/payments/$paymentId/pay',
      body: {
        'amountPaid': amount,
        'paymentMethod': method,
      },
    ) as Map<String, dynamic>;
    return FeePayment.fromJson(data);
  }

  Future<FeePayment> getReceipt(String paymentId) async {
    final data = await _api.get(
      '/fees/payments/$paymentId/receipt',
    ) as Map<String, dynamic>;
    return FeePayment.fromJson(data);
  }

  Future<List<FeePayment>> paymentsFor(String studentId) async {
    final data = await _api.get('/fees/payments', query: {'studentId': studentId});
    if (data is List) {
      return data
          .whereType<Map<String, dynamic>>()
          .map(FeePayment.fromJson)
          .toList();
    }
    return const [];
  }
}
