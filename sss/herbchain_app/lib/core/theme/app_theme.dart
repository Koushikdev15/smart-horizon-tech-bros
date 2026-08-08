import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// Component styling ported 1:1 from herbchain_web's shadcn/Tailwind
/// components: `rounded-xl` (14px) surfaces and buttons, `shadow-sm`
/// bordered cards, solid-fill primary buttons — not glass/pill everywhere.
class AppTheme {
  static const double radius = 14;
  static const double radiusSm = 10;

  static TextTheme _textTheme(Color primaryText, Color secondaryText) {
    final base = GoogleFonts.interTextTheme();
    final heading = GoogleFonts.plusJakartaSansTextTheme();
    return base
        .copyWith(
          displayLarge: heading.displayLarge?.copyWith(color: primaryText, fontWeight: FontWeight.w700, letterSpacing: -0.5),
          displayMedium: heading.displayMedium?.copyWith(color: primaryText, fontWeight: FontWeight.w700, letterSpacing: -0.5),
          headlineLarge: heading.headlineLarge?.copyWith(color: primaryText, fontWeight: FontWeight.w700, letterSpacing: -0.3),
          headlineMedium: heading.headlineMedium?.copyWith(color: primaryText, fontWeight: FontWeight.w700, letterSpacing: -0.3),
          headlineSmall: heading.headlineSmall?.copyWith(color: primaryText, fontWeight: FontWeight.w600),
          titleLarge: heading.titleLarge?.copyWith(color: primaryText, fontWeight: FontWeight.w600),
          titleMedium: heading.titleMedium?.copyWith(color: primaryText, fontWeight: FontWeight.w600),
          titleSmall: heading.titleSmall?.copyWith(color: primaryText, fontWeight: FontWeight.w600),
        )
        .apply(bodyColor: primaryText, displayColor: primaryText)
        .copyWith(
          bodyLarge: base.bodyLarge?.copyWith(color: primaryText),
          bodyMedium: base.bodyMedium?.copyWith(color: secondaryText),
          bodySmall: base.bodySmall?.copyWith(color: secondaryText),
          labelLarge: base.labelLarge?.copyWith(color: primaryText, fontWeight: FontWeight.w600),
        );
  }

  static ThemeData get darkTheme {
    const primary = AppColors.darkPrimary;
    final textTheme = _textTheme(AppColors.darkTextPrimary, AppColors.darkTextSecondary);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.darkBackground,
      colorScheme: const ColorScheme.dark(
        primary: primary,
        onPrimary: AppColors.onDarkPrimary,
        secondary: AppColors.darkSecondary,
        onSecondary: AppColors.onDarkSecondary,
        tertiary: AppColors.darkAccent,
        onTertiary: AppColors.onDarkAccent,
        surface: AppColors.darkSurface,
        onSurface: AppColors.darkTextPrimary,
        error: AppColors.darkError,
        onError: Colors.black,
        outline: AppColors.darkBorder,
      ),
      textTheme: textTheme,
      splashFactory: InkRipple.splashFactory,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        foregroundColor: AppColors.darkTextPrimary,
      ),
      cardTheme: CardThemeData(
        color: AppColors.darkSurface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
          side: const BorderSide(color: AppColors.darkBorder),
        ),
      ),
      dividerTheme: const DividerThemeData(color: AppColors.darkBorder, thickness: 1, space: 1),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: AppColors.onDarkPrimary,
          disabledBackgroundColor: primary.withValues(alpha: 0.35),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius)),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          elevation: 0,
          textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, fontSize: 15.5),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.darkTextPrimary,
          side: const BorderSide(color: AppColors.darkBorder),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius)),
          padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 22),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusSm)),
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
      ),
      iconTheme: const IconThemeData(color: AppColors.darkTextSecondary),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkBackground,
        contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        labelStyle: GoogleFonts.inter(color: AppColors.darkTextSecondary, fontSize: 13.5),
        hintStyle: GoogleFonts.inter(color: AppColors.darkTextSecondary.withValues(alpha: 0.6)),
        prefixIconColor: AppColors.darkTextSecondary,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: AppColors.darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: AppColors.darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: AppColors.darkError, width: 1.4),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: AppColors.darkError, width: 2),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.darkSurface,
        elevation: 0,
        indicatorColor: primary.withValues(alpha: 0.16),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return GoogleFonts.inter(
            fontSize: 12,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
            color: selected ? primary : AppColors.darkTextSecondary,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return IconThemeData(color: selected ? primary : AppColors.darkTextSecondary);
        }),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.darkSurfaceElevated,
        contentTextStyle: GoogleFonts.inter(color: AppColors.darkTextPrimary),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius)),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.darkMuted,
        labelStyle: GoogleFonts.inter(color: AppColors.darkTextPrimary, fontSize: 13, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusSm), side: const BorderSide(color: AppColors.darkBorder)),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: primary),
    );
  }

  static ThemeData get lightTheme {
    const primary = AppColors.primary;
    final textTheme = _textTheme(AppColors.textPrimary, AppColors.textSecondary);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: const ColorScheme.light(
        primary: primary,
        onPrimary: AppColors.onPrimary,
        secondary: AppColors.secondary,
        onSecondary: AppColors.onSecondary,
        tertiary: AppColors.accent,
        onTertiary: AppColors.onAccent,
        surface: AppColors.surface,
        onSurface: AppColors.textPrimary,
        error: AppColors.error,
        onError: Colors.white,
        outline: AppColors.border,
      ),
      textTheme: textTheme,
      splashFactory: InkRipple.splashFactory,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        foregroundColor: AppColors.textPrimary,
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
          side: const BorderSide(color: AppColors.border),
        ),
      ),
      dividerTheme: const DividerThemeData(color: AppColors.border, thickness: 1, space: 1),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: AppColors.onPrimary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius)),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          elevation: 0,
          textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, fontSize: 15.5),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.textPrimary,
          side: const BorderSide(color: AppColors.border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius)),
          padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 22),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusSm)),
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        labelStyle: GoogleFonts.inter(color: AppColors.textSecondary, fontSize: 13.5),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: AppColors.error, width: 1.4),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.surface,
        elevation: 0,
        indicatorColor: primary.withValues(alpha: 0.12),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.muted,
        labelStyle: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusSm), side: const BorderSide(color: AppColors.border)),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: primary),
    );
  }
}
