import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:herbchain_app/features/collection/providers/collection_provider.dart';
import 'package:herbchain_app/core/theme/app_colors.dart';
import 'package:herbchain_app/core/widgets/app_card.dart';
import 'package:herbchain_app/core/widgets/empty_state.dart';
import 'package:herbchain_app/core/widgets/offline_banner.dart';
import 'package:herbchain_app/core/widgets/shimmer_box.dart';
import 'package:herbchain_app/core/widgets/status_chip.dart';

class OfflineQueueScreen extends ConsumerWidget {
  const OfflineQueueScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offlineCollections = ref.watch(offlineCollectionsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Offline Queue'),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync_rounded),
            onPressed: () => ref.invalidate(offlineCollectionsProvider),
          ),
        ],
      ),
      body: Column(
          children: [
            const OfflineBanner(),
            Expanded(
              child: offlineCollections.when(
                data: (collections) {
                  if (collections.isEmpty) {
                    return const Center(
                      child: EmptyState(
                        icon: Icons.cloud_done_rounded,
                        title: 'All caught up!',
                        message: 'Every collection has synced to the blockchain ledger. Nothing pending.',
                      ),
                    );
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: collections.length,
                    itemBuilder: (context, index) {
                      final collection = collections[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: AppCard(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: AppColors.darkAccent.withValues(alpha: 0.16),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: const Icon(Icons.cloud_upload_rounded, color: AppColors.darkAccent, size: 22),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('${collection.species} (${collection.quantity} ${collection.unit})',
                                        style: const TextStyle(fontWeight: FontWeight.w700)),
                                    const SizedBox(height: 4),
                                    Text('Captured on ${collection.harvestDate}', style: Theme.of(context).textTheme.bodySmall),
                                  ],
                                ),
                              ),
                              const StatusChip(label: 'Pending', color: AppColors.darkAccent, icon: Icons.schedule_rounded),
                            ],
                          ),
                        ),
                      ).animate().fadeIn(delay: (index * 60).ms, duration: 300.ms).slideX(begin: 0.06, end: 0);
                    },
                  );
                },
                loading: () => ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: 3,
                  itemBuilder: (context, index) => const ShimmerListTile(),
                ),
                error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.darkError))),
              ),
            ),
          ],
        ),
    );
  }
}
