import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppPreferences {
  AppPreferences(this._prefs);
  final SharedPreferences _prefs;

  static Future<AppPreferences> load() async =>
      AppPreferences(await SharedPreferences.getInstance());

  static const _kLastChild = 'last_selected_child_id';
  static const _kLocale = 'app_locale';
  static const _kTheme = 'app_theme_mode';
  static const _kOnboarded = 'app_onboarded';
  static const _kBiometricEmail = 'biometric_email';
  static const _kFcmToken = 'fcm_token';

  String? get lastChildId => _prefs.getString(_kLastChild);
  Future<void> setLastChildId(String? value) async {
    if (value == null) {
      await _prefs.remove(_kLastChild);
    } else {
      await _prefs.setString(_kLastChild, value);
    }
  }

  Locale? get locale {
    final code = _prefs.getString(_kLocale);
    if (code == null) return null;
    return Locale(code);
  }

  Future<void> setLocale(Locale? value) async {
    if (value == null) {
      await _prefs.remove(_kLocale);
    } else {
      await _prefs.setString(_kLocale, value.languageCode);
    }
  }

  ThemeMode get themeMode {
    final value = _prefs.getString(_kTheme);
    switch (value) {
      case 'dark':
        return ThemeMode.dark;
      case 'light':
        return ThemeMode.light;
      default:
        return ThemeMode.system;
    }
  }

  Future<void> setThemeMode(ThemeMode value) async {
    final code = switch (value) {
      ThemeMode.dark => 'dark',
      ThemeMode.light => 'light',
      ThemeMode.system => 'system',
    };
    await _prefs.setString(_kTheme, code);
  }

  bool get onboarded => _prefs.getBool(_kOnboarded) ?? false;
  Future<void> setOnboarded(bool value) => _prefs.setBool(_kOnboarded, value);

  String? get biometricEmail => _prefs.getString(_kBiometricEmail);
  Future<void> setBiometricEmail(String? value) async {
    if (value == null) {
      await _prefs.remove(_kBiometricEmail);
    } else {
      await _prefs.setString(_kBiometricEmail, value);
    }
  }

  String? get fcmToken => _prefs.getString(_kFcmToken);
  Future<void> setFcmToken(String? value) async {
    if (value == null) {
      await _prefs.remove(_kFcmToken);
    } else {
      await _prefs.setString(_kFcmToken, value);
    }
  }
}
