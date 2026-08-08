import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';
import 'gradient_button.dart';

/// Friendly empty-state graphic + prompt, shown instead of a blank screen.
class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 92,
            height: 92,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [AppColors.darkPrimary.withValues(alpha: 0.18), Colors.transparent],
              ),
              border: Border.all(color: AppColors.darkBorder),
            ),
            child: Icon(icon, size: 38, color: AppColors.darkPrimary),
          ).animate().scale(duration: 420.ms, curve: Curves.easeOutBack).fadeIn(),
          const SizedBox(height: 24),
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge,
          ).animate().fadeIn(delay: 120.ms).slideY(begin: 0.15, end: 0),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.15, end: 0),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 24),
            PrimaryGlowButton(label: actionLabel!, onPressed: onAction, expand: false)
                .animate()
                .fadeIn(delay: 280.ms)
                .slideY(begin: 0.15, end: 0),
          ],
        ],
      ),
    );
  }
}
