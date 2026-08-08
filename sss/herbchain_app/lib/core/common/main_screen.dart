import 'package:flutter/material.dart';
import 'package:herbchain_app/core/theme/app_colors.dart';
import 'package:herbchain_app/features/collection/presentation/screens/home_dashboard_screen.dart';
import 'package:herbchain_app/features/offline/presentation/screens/offline_queue_screen.dart';
import 'package:herbchain_app/features/profile/presentation/screens/profile_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  final List<Widget> _screens = const [
    HomeDashboardScreen(),
    OfflineQueueScreen(),
    ProfileScreen(),
  ];

  static const _destinations = [
    (icon: Icons.home_rounded, label: 'Home'),
    (icon: Icons.cloud_upload_rounded, label: 'Queue'),
    (icon: Icons.person_rounded, label: 'Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : AppColors.surface,
          border: Border(top: BorderSide(color: isDark ? AppColors.darkBorder : AppColors.border)),
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 64,
            child: Row(
              children: List.generate(_destinations.length, (index) {
                final selected = index == _currentIndex;
                final dest = _destinations[index];
                return Expanded(
                  child: _NavItem(
                    icon: dest.icon,
                    label: dest.label,
                    selected: selected,
                    onTap: () => setState(() => _currentIndex = index),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({required this.icon, required this.label, required this.selected, required this.onTap});

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primary = isDark ? AppColors.darkPrimary : AppColors.primary;
    final muted = isDark ? AppColors.darkTextSecondary : AppColors.textSecondary;
    final color = selected ? primary : muted;

    return InkWell(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            height: 3,
            width: selected ? 28 : 0,
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(color: primary, borderRadius: BorderRadius.circular(3)),
          ),
          Icon(icon, size: 22, color: color),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(color: color, fontWeight: selected ? FontWeight.w700 : FontWeight.w500, fontSize: 11.5)),
        ],
      ),
    );
  }
}
