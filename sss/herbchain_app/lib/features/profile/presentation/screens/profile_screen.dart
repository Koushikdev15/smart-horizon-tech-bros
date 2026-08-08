import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:herbchain_app/features/authentication/providers/auth_provider.dart';
import 'package:go_router/go_router.dart';
import 'package:herbchain_app/core/theme/app_colors.dart';
import 'package:herbchain_app/core/widgets/app_card.dart';
import 'package:herbchain_app/core/widgets/gradient_button.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primary = isDark ? AppColors.darkPrimary : AppColors.primary;
    final accent = isDark ? AppColors.darkAccent : AppColors.accent;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: authState.when(
        data: (user) {
          if (user == null) return const Center(child: Text('Not logged in'));
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
            children: [
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 88,
                      height: 88,
                      decoration: BoxDecoration(shape: BoxShape.circle, color: primary.withValues(alpha: 0.12)),
                      child: Center(
                        child: Text(
                          user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
                          style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: primary),
                        ),
                      ),
                    ).animate().scale(duration: 400.ms, curve: Curves.easeOutBack),
                    const SizedBox(height: 16),
                    Text(user.name, style: Theme.of(context).textTheme.headlineSmall).animate().fadeIn(delay: 100.ms),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: accent.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
                      child: Text(
                        user.role,
                        style: TextStyle(color: accent, fontWeight: FontWeight.w700, fontSize: 12),
                      ),
                    ).animate().fadeIn(delay: 160.ms),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              AppCard(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Column(
                  children: [
                    _InfoRow(icon: Icons.mail_outline_rounded, label: 'Email', value: user.email),
                    const Divider(height: 1, indent: 60),
                    _InfoRow(icon: Icons.phone_outlined, label: 'Mobile', value: user.mobile),
                  ],
                ),
              ).animate().fadeIn(delay: 220.ms, duration: 400.ms).slideY(begin: 0.06, end: 0),
              const SizedBox(height: 24),
              PrimaryGlowButton(
                label: 'Log Out',
                icon: Icons.logout_rounded,
                onPressed: () {
                  ref.read(authStateProvider.notifier).logout();
                  context.go('/login');
                },
              ).animate().fadeIn(delay: 320.ms, duration: 400.ms),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.darkError))),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(color: primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, size: 18, color: primary),
          ),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 2),
              Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      ),
    );
  }
}
