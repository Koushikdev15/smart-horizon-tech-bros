import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';

/// TextFormField with a labeled icon prefix and a crisp focus ring —
/// matching herbchain_web's `Input` (`rounded-xl`, `focus:ring-2`).
class GlowTextField extends StatefulWidget {
  const GlowTextField({
    super.key,
    this.label,
    this.hint,
    this.controller,
    this.icon,
    this.obscureText = false,
    this.keyboardType,
    this.validator,
    this.suffix,
    this.readOnly = false,
    this.onTap,
    this.maxLines = 1,
  }) : assert(label != null || hint != null, 'Provide either a floating label or a hint');

  /// Floating Material label. Omit and pass [hint] instead when the field
  /// name is already shown as a separate heading above (e.g. Password +
  /// "Forgot password?" on the same row, matching herbchain_web's layout).
  final String? label;
  final String? hint;
  final TextEditingController? controller;
  final IconData? icon;
  final bool obscureText;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final Widget? suffix;
  final bool readOnly;
  final VoidCallback? onTap;
  final int maxLines;

  @override
  State<GlowTextField> createState() => _GlowTextFieldState();
}

class _GlowTextFieldState extends State<GlowTextField> {
  final _focusNode = FocusNode();
  bool _focused = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() => setState(() => _focused = _focusNode.hasFocus));
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primary = isDark ? AppColors.darkPrimary : AppColors.primary;
    final textColor = isDark ? AppColors.darkTextPrimary : AppColors.textPrimary;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      curve: Curves.easeOut,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppTheme.radius),
        boxShadow: _focused ? [BoxShadow(color: primary.withValues(alpha: 0.22), blurRadius: 0, spreadRadius: 3)] : [],
      ),
      child: TextFormField(
        controller: widget.controller,
        focusNode: _focusNode,
        obscureText: widget.obscureText,
        keyboardType: widget.keyboardType,
        validator: widget.validator,
        readOnly: widget.readOnly,
        onTap: widget.onTap,
        maxLines: widget.maxLines,
        style: TextStyle(color: textColor),
        decoration: InputDecoration(
          labelText: widget.label,
          hintText: widget.hint,
          prefixIcon: widget.icon != null ? Icon(widget.icon) : null,
          suffixIcon: widget.suffix,
        ),
      ),
    );
  }
}
