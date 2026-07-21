import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:staff_app/data/api/api_client.dart';

class UploadService {
  UploadService(this._api);
  final ApiClient _api;

  Future<List<String>> pickAndUpload({List<String>? allowedExtensions}) async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      type: allowedExtensions == null ? FileType.any : FileType.custom,
      allowedExtensions: allowedExtensions,
    );
    if (result == null) return const [];

    final urls = <String>[];
    for (final file in result.files) {
      final url = await _uploadFile(file);
      if (url != null) urls.add(url);
    }
    return urls;
  }

  Future<String?> _uploadFile(PlatformFile file) async {
    final bytes = file.bytes;
    final fileName = file.name;
    if (bytes == null) return null;

    final uri = Uri.parse('${_api.baseUrl}/uploads');
    final request = http.MultipartRequest('POST', uri)
      ..headers['Authorization'] = 'Bearer ${_api.token}'
      ..headers['Accept'] = 'application/json'
      ..fields['purpose'] = 'homework-attachment'
      ..files.add(
        http.MultipartFile.fromBytes(
          'file',
          bytes,
          filename: fileName,
          contentType: MediaType.parse(_guessMimeType(fileName)),
        ),
      );

    final response = await request.send().timeout(const Duration(seconds: 30));
    if (response.statusCode != 201) return null;

    final body = await response.stream.bytesToString();
    return body;
  }

  String _guessMimeType(String name) {
    final ext = name.split('.').last.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }
}
