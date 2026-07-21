import 'package:file_picker/file_picker.dart';
import 'package:uuid/uuid.dart';

class PickedAttachment {
  const PickedAttachment(
      {required this.name, required this.path, required this.size});

  final String name;
  final String? path;
  final int size;
}

class MockUploadService {
  static const _uuid = Uuid();

  Future<List<String>> pickAndUpload({List<String>? allowedExtensions}) async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      type: allowedExtensions == null ? FileType.any : FileType.custom,
      allowedExtensions: allowedExtensions,
    );
    if (result == null) return const [];
    return result.files.map((file) {
      final id = _uuid.v4();
      return 'mock-upload://$id/${Uri.encodeComponent(file.name)}';
    }).toList();
  }
}
