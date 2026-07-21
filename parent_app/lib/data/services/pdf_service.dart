import 'dart:io';
import 'dart:typed_data';

import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:share_plus/share_plus.dart';

import '../models/fees.dart';
import '../models/academics.dart';

class PdfService {
  PdfService();

  Future<void> shareReceipt(FeePayment payment, {String? studentName}) async {
    final bytes = await _renderReceipt(payment, studentName: studentName);
    final file = await _writeBytes(bytes, 'receipt-${payment.id}.pdf');
    await Share.shareXFiles(
      [XFile(file.path, mimeType: 'application/pdf', name: 'receipt.pdf')],
      subject: 'Fee receipt ${payment.receiptNumber ?? payment.id}',
    );
  }

  Future<Uint8List> receiptBytes(FeePayment payment, {String? studentName}) =>
      _renderReceipt(payment, studentName: studentName);

  Future<void> shareReportCard(ReportCard card, {required String studentName}) async {
    final bytes = await _renderReportCard(card, studentName: studentName);
    final file = await _writeBytes(bytes, 'report-${card.id}.pdf');
    await Share.shareXFiles(
      [XFile(file.path, mimeType: 'application/pdf', name: 'report-card.pdf')],
      subject: 'Report card ${card.term}',
    );
  }

  Future<Uint8List> reportCardBytes(ReportCard card, {required String studentName}) =>
      _renderReportCard(card, studentName: studentName);

  Future<Uint8List> _renderReceipt(FeePayment payment, {String? studentName}) async {
    final doc = pw.Document();
    doc.addPage(pw.Page(
      pageFormat: PdfPageFormat.roll80,
      build: (context) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.stretch,
        children: [
          pw.Text('School Companion',
              style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold)),
          pw.SizedBox(height: 4),
          pw.Text('Fee receipt', style: const pw.TextStyle(fontSize: 12)),
          pw.Divider(),
          if (studentName != null) _kv('Student', studentName),
          _kv('Receipt #', payment.receiptNumber ?? '—'),
          _kv('Transaction', payment.transactionId ?? '—'),
          _kv('Method', payment.paymentMethod ?? '—'),
          _kv('Date', payment.paidAt?.toString() ?? '—'),
          pw.SizedBox(height: 8),
          _kv('Amount due', payment.amountDue.toStringAsFixed(2)),
          _kv('Amount paid', payment.amountPaid.toStringAsFixed(2)),
          pw.Divider(),
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text('Total', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
              pw.Text(payment.amountPaid.toStringAsFixed(2),
                  style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
            ],
          ),
          pw.SizedBox(height: 16),
          pw.Text(
            'Thank you for your payment.',
            style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey600),
            textAlign: pw.TextAlign.center,
          ),
        ],
      ),
    ));
    return doc.save();
  }

  Future<Uint8List> _renderReportCard(ReportCard card, {required String studentName}) async {
    final doc = pw.Document();
    doc.addPage(pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      build: (context) => [
        pw.Text('School Companion',
            style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold)),
        pw.Text('Report card — ${card.term}',
            style: const pw.TextStyle(fontSize: 16, color: PdfColors.grey700)),
        pw.SizedBox(height: 12),
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text('Student: $studentName'),
            pw.Text('Issued: ${_formatDate(card.issuedOn)}'),
          ],
        ),
        pw.SizedBox(height: 12),
        pw.TableHelper.fromTextArray(
          headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold),
          cellAlignment: pw.Alignment.centerLeft,
          headers: const ['Subject', 'Marks', 'Max', 'Grade', '%'],
          data: card.grades
              .map((g) => [
                    g.subjectName,
                    g.marksObtained.toStringAsFixed(1),
                    g.maxMarks.toStringAsFixed(0),
                    g.grade,
                    g.percent.toStringAsFixed(0),
                  ])
              .toList(),
        ),
        pw.SizedBox(height: 12),
        pw.Text('Overall: ${card.overallPercent.toStringAsFixed(1)}%'),
        pw.Text('Attendance: ${card.attendancePercent.toStringAsFixed(1)}%'),
        if (card.classTeacherRemark != null) ...[
          pw.SizedBox(height: 8),
          pw.Text('Class teacher remark: ${card.classTeacherRemark}'),
        ],
      ],
    ));
    return doc.save();
  }

  pw.Widget _kv(String key, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 2),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(key, style: const pw.TextStyle(fontSize: 12, color: PdfColors.grey700)),
          pw.Text(value, style: const pw.TextStyle(fontSize: 12)),
        ],
      ),
    );
  }

  String _formatDate(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  Future<File> _writeBytes(Uint8List bytes, String name) async {
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$name');
    await file.writeAsBytes(bytes, flush: true);
    return file;
  }
}
