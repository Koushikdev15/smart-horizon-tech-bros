import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';

/// Solid primary action button — `bg-[#14B8A6]` / rounded-xl, matching
/// herbchain_web's Button component. A gentle press-scale is the only
/// flourish; every tap still gets a response.
class PrimaryGlowButton extends StatefulWidget {
  const PrimaryGlowButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.loading = false,
    this.expand = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool loading;
  final bool expand;

  @override
  State<PrimaryGlowButton> createState() => _PrimaryGlowButtonState();
}

class _PrimaryGlowButtonState extends State<PrimaryGlowButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final disabled = widget.onPressed == null || widget.loading;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primary = isDark ? AppColors.darkPrimary : AppColors.primary;
    final onPrimary = isDark ? AppColors.onDarkPrimary : AppColors.onPrimary;

    final button = AnimatedScale(
      scale: _pressed ? 0.97 : 1,
      duration: const Duration(milliseconds: 120),
      curve: Curves.easeOut,
      child: Container(
        width: widget.expand ? double.infinity : null,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
        decoration: BoxDecoration(
          color: disabled ? primary.withValues(alpha: 0.4) : primary,
          borderRadius: BorderRadius.circular(AppTheme.radius),
          boxShadow: disabled
              ? null
              : [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 6, offset: const Offset(0, 2))],
        ),
        child: Row(
          mainAxisSize: widget.expand ? MainAxisSize.max : MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (widget.loading)
              SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2.4, color: onPrimary),
              )
            else ...[
              if (widget.icon != null) ...[
                Icon(widget.icon, size: 19, color: onPrimary),
                const SizedBox(width: 8),
              ],
              Text(
                widget.label,
                style: TextStyle(color: onPrimary, fontWeight: FontWeight.w700, fontSize: 15.5),
              ),
            ],
          ],
        ),
      ),
    );

    return GestureDetector(
      onTapDown: disabled ? null : (_) => setState(() => _pressed = true),
      onTapUp: disabled ? null : (_) => setState(() => _pressed = false),
      onTapCancel: disabled ? null : () => setState(() => _pressed = false),
      onTap: disabled ? null : widget.onPressed,
      child: MouseRegion(cursor: disabled ? MouseCursor.defer : SystemMouseCursors.click, child: button),
    );
  }
}

/// Bordered secondary action button, matching web's `variant="outline"`.
class SecondaryGlowButton extends StatelessWidget {
  const SecondaryGlowButton({super.key, required this.label, this.onPressed, this.icon});

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onPressed,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 8)],
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
