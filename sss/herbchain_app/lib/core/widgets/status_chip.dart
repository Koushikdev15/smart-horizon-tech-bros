import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Small tinted-background badge for sync / blockchain status — colors and
/// shape (`rounded-md`, 10%-opacity fill, bold small text) match the web
/// portal's `.status-*` / `BatchStatusBadge` classes exactly.
class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.label, required this.color, this.icon});

  final String label;
  final Color color;
  final IconData? icon;

  factory StatusChip.forStatus(String status) {
    final s = status.toLowerCase();
    if (s.contains('pending') || s.contains('queue')) {
      return StatusChip(label: _titleCase(status), color: AppColors.darkAccent, icon: Icons.schedule_rounded);
    }
    if (s.contains('reject') || s.contains('fail') || s.contains('error')) {
      return StatusChip(label: _titleCase(status), color: AppColors.statusRejected, icon: Icons.error_outline_rounded);
    }
    if (s.contains('complete') || s.contains('verified') || s.contains('synced')) {
      return StatusChip(label: _titleCase(status), color: AppColors.statusCompleted, icon: Icons.check_circle_outline_rounded);
    }
    return StatusChip(label: _titleCase(status), color: AppColors.statusCollection, icon: Icons.radio_button_checked_rounded);
  }

  static String _titleCase(String status) => status.isEmpty
      ? 'Unknown'
      : status[0].toUpperCase() + status.substring(1);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[Icon(icon, size: 12, color: color), const SizedBox(width: 4)],
          Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
