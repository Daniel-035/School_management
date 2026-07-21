import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants/app_constants.dart';
import '../../core/providers.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/fees.dart';
import '../../data/services/payment_service.dart';

class PaymentSheet extends ConsumerStatefulWidget {
  final FeeStructure structure;
  final FeePayment payment;
  const PaymentSheet(
      {super.key, required this.structure, required this.payment});

  @override
  ConsumerState<PaymentSheet> createState() => _PaymentSheetState();
}

class _PaymentSheetState extends ConsumerState<PaymentSheet> {
  String _method = 'UPI';
  bool _busy = false;
  String? _error;
  String? _info;

  Future<void> _pay() async {
    final amount = widget.payment.amountDue - widget.payment.amountPaid;
    if (amount <= 0) return;
    setState(() {
      _busy = true;
      _error = null;
      _info = 'Opening Razorpay…';
    });
    try {
      final order = await ref.read(paymentRepositoryProvider).createOrder(
            studentId: widget.payment.studentId,
            feeStructureId: widget.payment.feeStructureId,
            amount: amount,
          );
      if (order == null) {
        setState(() {
          _error = 'We couldn\'t start the payment right now. Please try again.';
          _info = null;
        });
        return;
      }
      final student = ref.read(selectedStudentProvider);
      final parent = ref.read(authControllerProvider).valueOrNull;
      final service = ref.read(paymentServiceProvider);
      final result = await service.startPayment(
        studentName: student?.name ?? 'Parent',
        studentEmail: parent?.email ?? '',
        studentPhone: parent?.phone ?? '',
        payment: widget.payment,
        orderId: order.orderId,
        amountInPaise: order.amountInPaise,
        description: widget.structure.name,
      );
      if (!mounted) return;
      switch (result.outcome) {
        case PaymentOutcome.success:
          setState(() {
            _info = 'Payment successful.';
            _busy = false;
          });
          if (result.payment != null) Navigator.of(context).pop(result.payment);
          break;
        case PaymentOutcome.cancelled:
          setState(() {
            _info = null;
            _error = 'Payment was cancelled.';
            _busy = false;
          });
          break;
        case PaymentOutcome.failure:
          setState(() {
            _info = null;
            _error = result.message ?? 'Payment failed.';
            _busy = false;
          });
          break;
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _info = null;
        _busy = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final insets = MediaQuery.viewInsetsOf(context);
    final amount = widget.payment.amountDue - widget.payment.amountPaid;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 8, 20, 20 + insets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Pay ${widget.structure.name}',
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(Formatters.currency(amount),
              style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: Theme.of(context).colorScheme.primary,
                  )),
          const SizedBox(height: 16),
          Text('Payment method',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              for (final m in const ['UPI', 'Card', 'Netbanking', 'Wallet'])
                ChoiceChip(
                  label: Text(m),
                  selected: _method == m,
                  onSelected: (_) => setState(() => _method = m),
                ),
            ],
          ),
          if (_info != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.positive.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(Icons.lock_rounded,
                      color: AppColors.positive, size: 18),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_info!)),
                ],
              ),
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.danger.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline_rounded,
                      color: AppColors.danger, size: 18),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_error!)),
                ],
              ),
            ),
          ],
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.warning.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Row(
              children: [
                Icon(Icons.shield_outlined, color: AppColors.warning, size: 18),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Payments are processed by Razorpay with end-to-end encryption. You\'ll get a receipt instantly after payment.',
                    style: TextStyle(fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : _pay,
            child: _busy
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2.4, color: Colors.white),
                  )
                : Text('Pay ${Formatters.currency(amount)}'),
          ),
        ],
      ),
    );
  }
}
