import 'package:flutter/material.dart';

class AppConstants {
  AppConstants._();

  static const String appName = 'OmniSchool Guardian';
  static const String tagline = 'Stay close to your child\'s day';

  static const Color positiveColor = Color(0xFF1F9D55);
  static const Color warningColor = Color(0xFFE0A800);
  static const Color dangerColor = Color(0xFFC0392B);

  static const Duration shortAnim = Duration(milliseconds: 200);
  static const Duration mediumAnim = Duration(milliseconds: 350);
}

class AppColors {
  AppColors._();

  static const Color seedColor = Color(0xFF1E5BB8);
  static const Color positive = AppConstants.positiveColor;
  static const Color warning = AppConstants.warningColor;
  static const Color danger = AppConstants.dangerColor;
}
