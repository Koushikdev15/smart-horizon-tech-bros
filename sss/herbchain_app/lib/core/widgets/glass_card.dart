import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// The login card surface: solid `bg-card` in light mode, translucent +
/// blurred in dark mode — matching herbchain_web's `.login-card` exactly
/// (blur is a dark-mode-only touch there, not applied in light mode).
class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.borderRadius = 16,
    this.gradient,
    this.borderColor,
    this.blurSigma = 20,
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final double borderRadius;
  final Gradient? gradient;
  final Color? borderColor;
  final double blurSigma;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final radius = BorderRadius.circular(borderRadius);

    final inner = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: isDark && gradient == null ? const Color(0xCC0B1A29) : null,
        gradient: gradient ?? (isDark ? null : const LinearGradient(colors: [AppColors.surface, AppColors.surface])),
        borderRadius: radius,
        border: Border.all(color: borderColor ?? (isDark ? const Color(0x2614B8A6) : AppColors.border)),
      ),
      child: child,
    );

    final content = isDark
        ? ClipRRect(
            borderRadius: radius,
            child: BackdropFilter(filter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma), child: inner),
          )
        : inner;

    if (onTap == null) return content;
    return Material(
      color: Colors.transparent,
      borderRadius: radius,
      child: InkWell(borderRadius: radius, onTap: onTap, child: content),
    );
  }
}
