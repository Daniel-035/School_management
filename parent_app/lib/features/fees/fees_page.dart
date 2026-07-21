import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../core/utils/date_utils.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/fees.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/info_card.dart';
import '../../shared/widgets/section_header.dart';
import '../../shared/widgets/status_pill.dart';
import 'payment_sheet.dart';
import 'receipt_page.dart';

class FeesPage extends ConsumerWidget {
  const FeesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final student = ref.watch(selectedStudentProvider);
    if (student == null) {
      return const Scaffold(
        body: EmptyState(
          icon: Icons.person_off_rounded,
          title: 'No child linked',
        ),
      );
    }
    final structuresAsync = ref.watch(feeStructuresProvider);
    final summaryAsync = ref.watch(feesSummaryProvider(student.id));
    final paymentsAsync = ref.watch(feePaymentsProvider(student.id));

    final structures = structuresAsync.valueOrNull ?? const <FeeStructure>[];
    final summary = summaryAsync.valueOrNull;
    final payments = paymentsAsync.valueOrNull ?? const <FeePayment>[];

    return Scaffold(
      appBar: AppBar(title: const Text('Fees')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(feeStructuresProvider);
          ref.invalidate(feesSummaryProvider(student.id));
          ref.invalidate(feePaymentsProvider(student.id));
          await Future<void>.delayed(const Duration(milliseconds: 300));
        },
        child: ListView(
          padding: const EdgeInsets.only(bottom: 24),
          children: [
            if (summary != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: _OutstandingCard(
                  summary: summary,
                  studentName: student.name,
                ),
              ),
            const SectionHeader(title: 'Fee breakdown'),
            for (final s in structures.where(
                (s) => s.classSectionId == student.classSection.id))
              _StructureCard(
                structure: s,
                payment: payments.firstWhere(
                  (p) => p.feeStructureId == s.id,
                  orElse: () => FeePayment(
                    id: '',
                    studentId: student.id,
                    feeStructureId: s.id,
                    amountDue: 0,
                    amountPaid: 0,
                  ),
                ),
              ),
            const SectionHeader(title: 'Payment history'),
            if (payments.where((p) => p.amountPaid > 0).isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: InfoCard(
                  child: EmptyState(
                    icon: Icons.receipt_long_rounded,
                    title: 'No payments yet',
                  ),
                ),
              )
            else
              Builder(
                builder: (context) {
                  final paid = payments.where((p) => p.amountPaid > 0).toList();
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: InfoCard(
                      padding: EdgeInsets.zero,
                      child: Column(
                        children: [
                          for (var i = 0; i < paid.length; i++) ...[
                            if (i > 0) const Divider(height: 1),
                            _PaymentHistoryTile(
                              payment: paid[i],
                              structure: structures.firstWhere(
                                (s) => s.id == paid[i].feeStructureId,
                                orElse: () => FeeStructure(
                                  id: paid[i].feeStructureId,
                                  name: 'Fee payment',
                                  classSectionId: '',
                                  term: '',
                                  dueDate: DateTime.now(),
                                  components: const [],
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _OutstandingCard extends StatelessWidget {
  final FeeSummary summary;
  final String studentName;
  const _OutstandingCard({required this.summary, required this.studentName});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final hasDue = summary.outstanding > 0;
    return InfoCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(studentName,
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text('Academic year 2025–26',
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Outstanding',
                        style: Theme.of(context).textTheme.bodySmall),
                    Text(
                      Formatters.currency(summary.outstanding),
                      style: Theme.of(context)
                          .textTheme
                          .headlineMedium
                          ?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: hasDue
                                ? AppColors.warning
                                : AppColors.positive,
                          ),
                    ),
                  ],
                ),
              ),
              Flexible(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Total paid',
                        style: Theme.of(context).textTheme.bodySmall),
                    Text(Formatters.currency(summary.totalPaid),
                        style: Theme.of(context)
                            .textTheme
                            .titleLarge
                            ?.copyWith(fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: summary.totalDue == 0
                  ? 0
                  : (summary.totalPaid / summary.totalDue).clamp(0.0, 1.0),
              minHeight: 8,
              backgroundColor: scheme.surfaceContainerHighest,
            ),
          ),
        ],
      ),
    );
  }
}

class _StructureCard extends ConsumerWidget {
  final FeeStructure structure;
  final FeePayment payment;
  const _StructureCard({required this.structure, required this.payment});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final days = structure.dueDate
        .difference(DateTime.now().atMidnight)
        .inDays;
    final outstanding = payment.amountDue - payment.amountPaid;
    final (label, color) = switch (payment.status) {
      FeePaymentStatus.paid => ('Paid', AppColors.positive),
      FeePaymentStatus.partial => ('Partial', AppColors.warning),
      FeePaymentStatus.due => () {
          if (days < 0) return ('Overdue ${-days}d', AppColors.danger);
          if (days == 0) return ('Due today', AppColors.warning);
          return ('Due in ${days}d', Theme.of(context).colorScheme.primary);
        }(),
      FeePaymentStatus.overdue => ('Overdue', AppColors.danger),
    };

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: InfoCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(structure.name,
                          style: Theme.of(context)
                              .textTheme
                              .titleSmall
                              ?.copyWith(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 2),
                      Text(structure.term,
                          style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
                StatusPill(label: label, color: color),
              ],
            ),
            const SizedBox(height: 8),
            for (final c in structure.components)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  children: [
                    Expanded(child: Text(c.name)),
                    Text(Formatters.currency(c.amount),
                        style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
            const Divider(height: 16),
            Row(
              children: [
                Expanded(
                  child: Text('Total',
                      style: Theme.of(context)
                          .textTheme
                          .titleSmall
                          ?.copyWith(fontWeight: FontWeight.w700)),
                ),
                Text(Formatters.currency(structure.totalAmount),
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.w800)),
              ],
            ),
            if (outstanding > 0 && payment.id.isNotEmpty) ...[
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: () async {
                  final result = await showModalBottomSheet<FeePayment>(
                    context: context,
                    isScrollControlled: true,
                    showDragHandle: true,
                    builder: (_) => PaymentSheet(
                      structure: structure,
                      payment: payment,
                    ),
                  );
                  if (result != null && context.mounted) {
                    Navigator.of(context).push(MaterialPageRoute<void>(
                      builder: (_) => ReceiptPage(payment: result),
                    ));
                  }
                },
                icon: const Icon(Icons.lock_open_rounded),
                label: Text('Pay ${Formatters.currency(outstanding)}'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PaymentHistoryTile extends StatelessWidget {
  final FeePayment payment;
  final FeeStructure? structure;
  const _PaymentHistoryTile({required this.payment, this.structure});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.positive.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Icon(Icons.receipt_rounded, color: AppColors.positive),
      ),
      title: Text(structure?.name ?? 'Fee payment',
          style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(
          '${Formatters.currency(payment.amountPaid)} · ${payment.paymentMethod ?? '—'} · ${payment.paidAt == null ? '—' : Formatters.date(payment.paidAt!)}'),
      trailing: IconButton(
        icon: const Icon(Icons.download_rounded),
        tooltip: 'Download receipt',
        onPressed: () => Navigator.of(context).push<void>(
          MaterialPageRoute<void>(builder: (_) => ReceiptPage(payment: payment)),
        ),
      ),
    );
  }
}
