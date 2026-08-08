import 'package:flutter/material.dart';

/// Colors ported 1:1 from herbchain_web's `src/index.css` design tokens
/// ("Sandalwood & Forest" light / "Deep Cosmos" dark) so the app and the
/// web portal read as one product.
class AppColors {
  // ─── Dark theme ("Deep Cosmos") — default ───
  static const Color darkBackground = Color(0xFF0B1220);
  static const Color darkSurface = Color(0xFF071F1A);
  static const Color darkSurfaceElevated = Color(0xFF0A2E26);
  static const Color darkTextPrimary = Color(0xFFF8FAFC);
  static const Color darkTextSecondary = Color(0xFF94A3B8);
  static const Color darkMuted = Color(0xFF1A2333);
  static const Color darkBorder = Color(0x14FFFFFF); // white @ 8%

  static const Color darkPrimary = Color(0xFF14B8A6); // teal
  static const Color onDarkPrimary = Color(0xFF04120F);
  static const Color darkSecondary = Color(0xFF3B82F6); // royal blue
  static const Color onDarkSecondary = Color(0xFFF8FAFC);
  static const Color darkAccent = Color(0xFFF59E0B); // turmeric amber
  static const Color onDarkAccent = Color(0xFF1A1206);
  static const Color darkSuccess = Color(0xFF14B8A6);
  static const Color darkError = Color(0xFFF87171);

  // ─── Light theme ("Sandalwood & Forest") ───
  static const Color background = Color(0xFFF8FAFC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF4B5563);
  static const Color muted = Color(0xFFEDF1F5);
  static const Color border = Color(0xFFE5E7EB);

  static const Color primary = Color(0xFF1E7D57); // deep emerald
  static const Color onPrimary = Colors.white;
  static const Color secondary = Color(0xFF3B82F6);
  static const Color onSecondary = Colors.white;
  static const Color accent = Color(0xFFF59E0B);
  static const Color onAccent = Color(0xFF1A1206);
  static const Color success = Color(0xFF22C55E);
  static const Color error = Color(0xFFEF4444);

  // ─── Brand mark palette (shared, theme-independent) ───
  static const Color brandTeal = Color(0xFF0F766E);
  static const Color brandTealLight = Color(0xFF14B8A6);
  static const Color brandAmber = Color(0xFFF59E0B);

  // ─── Status badge colors (dark) ───
  static const Color statusCollection = Color(0xFF3B82F6);
  static const Color statusProcessing = Color(0xFFF59E0B);
  static const Color statusManufacturing = Color(0xFFA78BFA);
  static const Color statusCompleted = Color(0xFF14B8A6);
  static const Color statusRejected = Color(0xFFF87171);

  static const LinearGradient darkCardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [darkSurface, darkSurfaceElevated],
  );

  static const LinearGradient primaryGlowGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [darkPrimary, Color(0xFF0D9488)],
  );

  static const LinearGradient backgroundGlowGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF0D1830), darkBackground],
  );
}
