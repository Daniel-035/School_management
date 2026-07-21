import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:printing/printing.dart';

import '../../core/constants/app_constants.dart';
import '../../core/providers.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/fees.dart';

class ReceiptPage extends ConsumerWidget {
  final FeePayment payment;
  const ReceiptPage({super.key, required this.payment});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final student = ref.watch(selectedStudentProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Receipt'),
        actions: [
          IconButton(
            icon: const Icon(Icons.ios_share_rounded),
            tooltip: 'Share receipt',
            onPressed: () async {
              final pdf = ref.read(pdfServiceProvider);
              final messenger = ScaffoldMessenger.of(context);
              try {
                await pdf.shareReceipt(payment, studentName: student?.name);
              } catch (e) {
                messenger.showSnackBar(
                  SnackBar(content: Text('Couldn\'t share receipt: $e')),
                );
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.print_rounded),
            tooltip: 'Print / preview',
            onPressed: () async {
              final pdf = ref.read(pdfServiceProvider);
              final bytes = await pdf.receiptBytes(payment,
                  studentName: student?.name);
              await Printing.layoutPdf(onLayout: (_) async => bytes);
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: AppColors.positive.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.school_rounded,
                          color: AppColors.positive),
                    ),
                    const SizedBox(width: 12),
                    const Text('School Companion',
                        style: TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 16)),
                    const Spacer(),
                    const Text('RECEIPT',
                        style: TextStyle(
                            fontWeight: FontWeight.w800,
                            color: AppColors.positive,
                            letterSpacing: 1.4)),
                  ],
                ),
                const Divider(height: 24),
                _row(context, 'Receipt #', payment.receiptNumber ?? '—'),
                _row(context, 'Transaction', payment.transactionId ?? '—'),
                _row(
                    context,
                    'Date',
                    payment.paidAt == null
                        ? '—'
                        : Formatters.date(payment.paidAt!)),
                _row(context, 'Method', payment.paymentMethod ?? '—'),
                const Divider(height: 24),
                _row(context, 'Student', student?.name ?? payment.studentId),
                _row(context, 'Amount due',
                    Formatters.currency(payment.amountDue)),
                _row(context, 'Amount paid',
                    Formatters.currency(payment.amountPaid),
                    valueColor: AppColors.positive),
                const Divider(height: 24),
                Row(
                  children: [
                    const Text('Total paid',
                        style: TextStyle(fontWeight: FontWeight.w700)),
                    const Spacer(),
                    Text(Formatters.currency(payment.amountPaid),
                        style: const TextStyle(
                            fontWeight: FontWeight.w800, fontSize: 18)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () async {
              await Clipboard.setData(ClipboardData(
                  text: payment.receiptNumber ?? payment.transactionId ?? ''));
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Receipt ID copied')),
                );
              }
            },
            icon: const Icon(Icons.copy_rounded),
            label: const Text('Copy receipt ID'),
          ),
        ],
      ),
    );
  }

  Widget _row(BuildContext context, String label, String value,
      {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(label,
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant)),
          ),
          Text(value,
              style: TextStyle(fontWeight: FontWeight.w600, color: valueColor)),
        ],
      ),
    );
  }
}
