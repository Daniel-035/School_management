import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:staff_app/core/locale_controller.dart';
import 'package:staff_app/core/router.dart';
import 'package:staff_app/core/theme.dart';
import 'package:staff_app/data/school_repository.dart';
import 'package:staff_app/l10n/app_localizations.dart';

class StaffApp extends StatefulWidget {
  const StaffApp({super.key});

  @override
  State<StaffApp> createState() => _StaffAppState();
}

class _StaffAppState extends State<StaffApp> {
  late final SchoolRepository _repo;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _repo = SchoolRepository();
    AppRouter.bindRepository(_repo);
    _router = AppRouter.buildRouter();
  }

  @override
  void dispose() {
    _repo.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LocaleController()..load()),
        ChangeNotifierProvider.value(value: _repo),
      ],
      child: Consumer<LocaleController>(
        builder: (context, localeController, _) {
          return MaterialApp.router(
            title: 'OmniSchool Educator',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light(),
            locale: localeController.locale,
            supportedLocales: AppLocalizations.supportedLocales,
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            routerConfig: _router,
          );
        },
      ),
    );
  }
}
