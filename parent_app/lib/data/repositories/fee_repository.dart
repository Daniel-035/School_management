import '../api/api_client.dart';
import '../models/fees.dart';

class FeeRepository {
  FeeRepository(this._api);
  final ApiClient _api;

  List<FeeStructure> _structures = [];
  List<FeePayment> _payments = [];

  Future<void> _ensureStructures() async {
    if (_structures.isEmpty) {
      final data = await _api.get('/fees/structures');
      if (data is List) {
        _structures = data
            .whereType<Map<String, dynamic>>()
            .map(FeeStructure.fromJson)
            .toList();
      }
    }
  }

  Future<List<FeeStructure>> structures() async {
    await _ensureStructures();
    final list = [..._structures]..sort((a, b) => a.dueDate.compareTo(b.dueDate));
    return list;
  }

  Future<List<FeePayment>> paymentsFor(String studentId) async {
    final data = await _api.get('/fees/payments', query: {'studentId': studentId});
    if (data is List) {
      _payments = data
          .whereType<Map<String, dynamic>>()
          .map(FeePayment.fromJson)
          .toList();
    }
    return _payments.where((p) => p.studentId == studentId).toList();
  }

  Future<FeeStructure?> structureById(String id) async {
    await _ensureStructures();
    for (final s in _structures) {
      if (s.id == id) return s;
    }
    return null;
  }

  Future<FeePayment?> paymentForStructure(
    String studentId,
    String structureId,
  ) async {
    final pays = await paymentsFor(studentId);
    for (final p in pays) {
      if (p.studentId == studentId && p.feeStructureId == structureId) return p;
    }
    return null;
  }

  Future<FeeSummary> summaryFor(String studentId) async {
    final pays = await paymentsFor(studentId);
    final due = pays.fold<double>(0, (s, p) => s + p.amountDue);
    final paid = pays.fold<double>(0, (s, p) => s + p.amountPaid);
    return FeeSummary(
      totalDue: due,
      totalPaid: paid,
      outstanding: due - paid,
      structures: pays.length,
    );
  }

  Future<FeePayment> pay({
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
    );
    if (data is Map<String, dynamic>) {
      return FeePayment.fromJson(data);
    }
    throw const ApiException('Invalid payment response', code: 'invalid_response');
  }
}
