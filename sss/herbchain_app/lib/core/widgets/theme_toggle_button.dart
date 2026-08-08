import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_colors.dart';
import '../theme/theme_provider.dart';

/// Circular sun/moon toggle — `w-9 h-9 rounded-full border bg-card`,
/// matching herbchain_web's dark-mode toggle button exactly.
class ThemeToggleButton extends ConsumerWidget {
  const ThemeToggleButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeModeProvider) == ThemeMode.dark;
    return Material(
      color: isDark ? AppColors.darkSurface : AppColors.surface,
      shape: CircleBorder(side: BorderSide(color: isDark ? AppColors.darkBorder : AppColors.border)),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: () => ref.read(themeModeProvider.notifier).toggle(),
        child: SizedBox(
          width: 36,
          height: 36,
          child: Icon(
            isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
            size: 17,
            color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}
