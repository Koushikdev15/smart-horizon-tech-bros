import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:herbchain_app/features/authentication/providers/auth_provider.dart';
import 'package:herbchain_app/features/collection/providers/collection_provider.dart';
import 'package:herbchain_app/core/theme/app_colors.dart';
import 'package:herbchain_app/core/widgets/app_card.dart';
import 'package:herbchain_app/core/widgets/empty_state.dart';
import 'package:herbchain_app/core/widgets/offline_banner.dart';
import 'package:herbchain_app/core/widgets/shimmer_box.dart';
import 'package:herbchain_app/core/widgets/status_chip.dart';
import 'package:herbchain_app/core/widgets/theme_toggle_button.dart';
import 'package:herbchain_app/core/utils/async_value_x.dart';

class HomeDashboardScreen extends ConsumerWidget {
  const HomeDashboardScreen({super.key});

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offlineCollections = ref.watch(offlineCollectionsProvider);
    final remoteCollections = ref.watch(remoteCollectionsProvider);
    final user = ref.watch(authStateProvider).valueOrNull;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(offlineCollectionsProvider);
            ref.invalidate(remoteCollectionsProvider);
          },
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 120),
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_greeting(), style: Theme.of(context).textTheme.bodyMedium),
                        const SizedBox(height: 2),
                        Text(
                          user?.name.isNotEmpty == true ? user!.name : 'Collector',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                      ],
                    ),
                  ),
                  const ThemeToggleButton(),
                  const SizedBox(width: 10),
                  IconButton(
                    style: IconButton.styleFrom(
                      backgroundColor: Theme.of(context).cardTheme.color,
                      shape: CircleBorder(side: BorderSide(color: Theme.of(context).colorScheme.outline)),
                    ),
                    icon: const Icon(Icons.logout_rounded, size: 18),
                    onPressed: () {
                      ref.read(authStateProvider.notifier).logout();
                      context.go('/login');
                    },
                  ),
                ],
              ).animate().fadeIn(duration: 350.ms),
              const SizedBox(height: 8),
              const OfflineBanner(),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _KpiCard(
                      label: 'Synced Collections',
                      value: '${remoteCollections.valueOrNull?.length ?? 0}',
                      icon: Icons.cloud_done_rounded,
                      color: AppColors.statusCompleted,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: _KpiCard(
                      label: 'Pending Sync',
                      value: '${offlineCollections.valueOrNull?.length ?? 0}',
                      icon: Icons.schedule_rounded,
                      color: AppColors.darkAccent,
                    ),
                  ),
                ],
              ).animate().fadeIn(delay: 80.ms, duration: 400.ms).slideY(begin: 0.06, end: 0),
              const SizedBox(height: 26),
              Text('Quick Actions', style: Theme.of(context).textTheme.titleLarge)
                  .animate()
                  .fadeIn(delay: 140.ms, duration: 350.ms),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _ActionCard(
                      icon: Icons.add_circle_rounded,
                      title: 'New Collection',
                      color: AppColors.darkPrimary,
                      onTap: () => context.push('/create_collection'),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: _ActionCard(
                      icon: Icons.history_rounded,
                      title: 'History',
                      color: AppColors.statusCollection,
                      onTap: () => context.push('/collection_history'),
                    ),
                  ),
                ],
              ).animate().fadeIn(delay: 200.ms, duration: 350.ms).slideY(begin: 0.06, end: 0),
              const SizedBox(height: 26),
              Text('Recent Activity', style: Theme.of(context).textTheme.titleLarge)
                  .animate()
                  .fadeIn(delay: 260.ms, duration: 350.ms),
              const SizedBox(height: 12),
              remoteCollections.when(
                data: (collections) {
                  if (collections.isEmpty) {
                    return const EmptyState(
                      icon: Icons.eco_rounded,
                      title: 'No activity yet',
                      message: 'Your submitted collections will show up here once you log your first harvest.',
                    );
                  }
                  final recent = collections.take(6).toList();
                  return Column(
                    children: List.generate(recent.length, (index) {
                      final col = recent[index] as Map;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _ActivityTile(collection: col),
                      ).animate().fadeIn(delay: (300 + index * 60).ms, duration: 300.ms).slideX(begin: 0.06, end: 0);
                    }),
                  );
                },
                loading: () => Column(children: List.generate(3, (_) => const Padding(
                      padding: EdgeInsets.only(bottom: 10),
                      child: ShimmerListTile(),
                    ))),
                error: (e, _) => Text('Error loading activity: $e', style: const TextStyle(color: AppColors.darkError)),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/create_collection'),
        icon: const Icon(Icons.add_rounded),
        label: const Text('New Collection', style: TextStyle(fontWeight: FontWeight.w700)),
      ).animate().scale(delay: 350.ms, curve: Curves.easeOutBack),
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({required this.label, required this.value, required this.icon, required this.color});

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: Theme.of(context).textTheme.bodySmall, maxLines: 2),
                const SizedBox(height: 6),
                Text(value, style: Theme.of(context).textTheme.headlineSmall),
              ],
            ),
          ),
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(shape: BoxShape.circle, color: color.withValues(alpha: 0.12)),
            child: Icon(icon, size: 18, color: color),
          ),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({required this.icon, required this.title, required this.color, required this.onTap});

  final IconData icon;
  final String title;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
      child: Column(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(shape: BoxShape.circle, color: color.withValues(alpha: 0.12)),
            child: Icon(icon, size: 22, color: color),
          ),
          const SizedBox(height: 10),
          Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
        ],
      ),
    );
  }
}

class _ActivityTile extends StatelessWidget {
  const _ActivityTile({required this.collection});

  final Map collection;

  @override
  Widget build(BuildContext context) {
    final species = (collection['species'] ?? 'Unknown herb').toString();
    final quantity = collection['quantity'];
    final unit = (collection['unit'] ?? '').toString();
    final status = (collection['blockchainStatus'] ?? collection['status'] ?? 'collected').toString();
    final statusChip = StatusChip.forStatus(status);

    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: Stack(
        children: [
          AppCard(
            padding: const EdgeInsets.fromLTRB(16, 14, 14, 14),
            child: Row(
              children: [
                const SizedBox(width: 4),
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.darkPrimary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.grass_rounded, color: AppColors.darkPrimary, size: 20),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(species, style: const TextStyle(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 2),
                      Text('$quantity $unit', style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
                statusChip,
              ],
            ),
          ),
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            child: Container(width: 3, color: statusChip.color),
          ),
        ],
      ),
    );
  }
}
