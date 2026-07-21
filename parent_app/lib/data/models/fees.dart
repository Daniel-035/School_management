class FeeComponent {
  final String name;
  final double amount;

  const FeeComponent({required this.name, required this.amount});

  factory FeeComponent.fromJson(Map<String, dynamic> j) {
    return FeeComponent(
      name: (j['name'] as String?) ?? '',
      amount: ((j['amount'] as num?) ?? 0).toDouble(),
    );
  }
}

class FeeStructure {
  final String id;
  final String name;
  final String classSectionId;
  final String term;
  final DateTime dueDate;
  final List<FeeComponent> components;

  const FeeStructure({
    required this.id,
    required this.name,
    required this.classSectionId,
    required this.term,
    required this.dueDate,
    required this.components,
  });

  double get totalAmount =>
      components.fold<double>(0, (sum, c) => sum + c.amount);

  factory FeeStructure.fromJson(Map<String, dynamic> j) {
    return FeeStructure(
      id: j['id'] as String,
      name: (j['name'] as String?) ?? '',
      classSectionId: (j['classSectionId'] as String?) ?? '',
      term: (j['term'] as String?) ?? '',
      dueDate: DateTime.parse(j['dueDate'] as String),
      components: (j['components'] as List?)
              ?.whereType<Map<String, dynamic>>()
              .map(FeeComponent.fromJson)
              .toList() ??
          const [],
    );
  }
}

class FeeSummary {
  final double totalDue;
  final double totalPaid;
  final double outstanding;
  final int structures;
  const FeeSummary({
    required this.totalDue,
    required this.totalPaid,
    required this.outstanding,
    required this.structures,
  });

  factory FeeSummary.fromJson(Map<String, dynamic> j) {
    return FeeSummary(
      totalDue: ((j['totalDue'] as num?) ?? 0).toDouble(),
      totalPaid: ((j['totalPaid'] as num?) ?? 0).toDouble(),
      outstanding: ((j['outstanding'] as num?) ?? 0).toDouble(),
      structures: (j['count'] as num?)?.toInt() ?? 0,
    );
  }
}

enum FeePaymentStatus { paid, partial, due, overdue }

FeePaymentStatus _statusFromString(String? s) {
  switch (s) {
    case 'paid':
      return FeePaymentStatus.paid;
    case 'overdue':
      return FeePaymentStatus.overdue;
    case 'partial':
      return FeePaymentStatus.partial;
    case 'due':
    case 'pending':
    default:
      return FeePaymentStatus.due;
  }
}

class FeePayment {
  final String id;
  final String studentId;
  final String feeStructureId;
  final double amountDue;
  final double amountPaid;
  final DateTime? paidAt;
  final String? transactionId;
  final String? receiptNumber;
  final String? paymentMethod;
  final FeePaymentStatus status;

  const FeePayment({
    required this.id,
    required this.studentId,
    required this.feeStructureId,
    required this.amountDue,
    required this.amountPaid,
    this.paidAt,
    this.transactionId,
    this.receiptNumber,
    this.paymentMethod,
    this.status = FeePaymentStatus.due,
  });

  double get outstanding => amountDue - amountPaid;

  factory FeePayment.fromJson(Map<String, dynamic> j) {
    final amountDue = ((j['amountDue'] as num?) ?? 0).toDouble();
    final amountPaid = ((j['amountPaid'] as num?) ?? 0).toDouble();
    final statusStr = j['status'] as String?;
    FeePaymentStatus status;
    if (statusStr != null) {
      status = _statusFromString(statusStr);
    } else if (amountPaid >= amountDue) {
      status = FeePaymentStatus.paid;
    } else if (amountPaid > 0) {
      status = FeePaymentStatus.partial;
    } else {
      status = FeePaymentStatus.due;
    }
    return FeePayment(
      id: j['id'] as String,
      studentId: j['studentId'] as String,
      feeStructureId: j['feeStructureId'] as String,
      amountDue: amountDue,
      amountPaid: amountPaid,
      paidAt: j['paidAt'] != null ? DateTime.tryParse(j['paidAt'] as String) : null,
      transactionId: j['transactionId'] as String?,
      receiptNumber: j['receiptNumber'] as String?,
      paymentMethod: j['paymentMethod'] as String?,
      status: status,
    );
  }
}
