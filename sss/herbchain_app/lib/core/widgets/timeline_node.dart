import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// One entry in a vertical timeline (used for collection history), with a
/// glowing node dot and a connecting line down to the next entry.
class AnimatedTimelineNode extends StatelessWidget {
  const AnimatedTimelineNode({
    super.key,
    required this.child,
    required this.isFirst,
    required this.isLast,
    this.color = AppColors.darkPrimary,
    this.icon = Icons.grass_rounded,
  });

  final Widget child;
  final bool isFirst;
  final bool isLast;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 40,
            child: Column(
              children: [
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: color.withValues(alpha: 0.16),
                    border: Border.all(color: color.withValues(alpha: 0.5)),
                    boxShadow: [BoxShadow(color: color.withValues(alpha: 0.28), blurRadius: 14)],
                  ),
                  child: Icon(icon, size: 16, color: color),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [color.withValues(alpha: 0.5), color.withValues(alpha: 0.05)],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: Padding(padding: const EdgeInsets.only(bottom: 20), child: child)),
        ],
      ),
    );
  }
}
