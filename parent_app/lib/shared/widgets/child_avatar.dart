import 'package:flutter/material.dart';

class ChildAvatar extends StatelessWidget {
  final String initials;
  final double size;
  final Color? color;
  final String? imageUrl;
  const ChildAvatar({
    super.key,
    required this.initials,
    this.size = 40,
    this.color,
    this.imageUrl,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final bg = color ?? scheme.primaryContainer;
    final fg = scheme.onPrimaryContainer;

    if (imageUrl != null && imageUrl!.trim().isNotEmpty) {
      final url = imageUrl!.trim();
      return CircleAvatar(
        radius: size / 2,
        backgroundColor: bg,
        backgroundImage: NetworkImage(url),
        onBackgroundImageError: (_, __) {},
        child: Text(
          initials,
          style: TextStyle(
            color: fg,
            fontWeight: FontWeight.w700,
            fontSize: size * 0.38,
          ),
        ),
      );
    }

    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: bg,
        shape: BoxShape.circle,
      ),
      child: Text(
        initials,
        style: TextStyle(
          color: fg,
          fontWeight: FontWeight.w700,
          fontSize: size * 0.38,
        ),
      ),
    );
  }
}
