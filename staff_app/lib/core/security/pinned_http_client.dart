import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:http/io_client.dart';

IOClient createPinnedHttpClient() {
  const expected = String.fromEnvironment('API_CERT_SHA256');
  final httpClient = HttpClient();
  if (expected.isEmpty) return IOClient(httpClient);

  httpClient.badCertificateCallback = (cert, host, port) {
    final fingerprint = sha256
        .convert(cert.der)
        .bytes
        .map((b) => b.toRadixString(16).padLeft(2, '0'))
        .join(':');
    return fingerprint.toLowerCase() == expected.toLowerCase();
  };
  return IOClient(httpClient);
}
