import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:herbchain_app/features/collection/providers/collection_provider.dart';
import 'package:herbchain_app/core/theme/app_colors.dart';
import 'package:herbchain_app/core/widgets/app_card.dart';
import 'package:herbchain_app/core/widgets/empty_state.dart';
import 'package:herbchain_app/core/widgets/shimmer_box.dart';
import 'package:herbchain_app/core/widgets/status_chip.dart';

class CollectionHistoryScreen extends ConsumerWidget {
  const CollectionHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final remoteCollections = ref.watch(remoteCollectionsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Collection History')),
      body: remoteCollections.when(
        data: (collections) {
          if (collections.isEmpty) {
            return const Center(
              child: EmptyState(
                icon: Icons.inventory_2_outlined,
                title: 'No collections found',
                message: 'Collections you submit will appear here once synced with the blockchain ledger.',
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: collections.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final col = collections[index] as Map;
              final status = (col['blockchainStatus'] ?? col['status'] ?? 'collected').toString();
              final statusChip = StatusChip.forStatus(status);
              return AppCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: AppColors.darkPrimary.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.eco_rounded, color: AppColors.darkPrimary, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${col['species']} · ${col['quantity']} ${col['unit']}',
                                style: const TextStyle(fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: 4),
                              statusChip,
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right_rounded, color: AppColors.darkTextSecondary),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(3),
                      child: SizedBox(
                        height: 4,
                        child: Row(
                          children: List.generate(5, (i) {
                            return Expanded(
                              child: Container(
                                margin: EdgeInsets.only(right: i == 4 ? 0 : 3),
                                color: i == 0 ? statusChip.color : Theme.of(context).colorScheme.outline.withValues(alpha: 0.4),
                              ),
                            );
                          }),
                        ),
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: (index * 50).ms, duration: 280.ms).slideY(begin: 0.04, end: 0);
            },
          );
        },
        loading: () => ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: 4,
          itemBuilder: (context, index) => const ShimmerListTile(),
        ),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.darkError))),
      ),
    );
  }
}
