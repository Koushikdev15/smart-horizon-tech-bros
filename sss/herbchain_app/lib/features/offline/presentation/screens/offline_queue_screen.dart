import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:herbchain_app/features/collection/providers/collection_provider.dart';
import 'package:go_router/go_router.dart';

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
            icon: const Icon(Icons.sync),
            onPressed: () {
              // Trigger sync
            },
          ),
        ],
      ),
      body: offlineCollections.when(
        data: (collections) {
          if (collections.isEmpty) {
            return const Center(child: Text('No pending collections.'));
          }
          return ListView.builder(
            itemCount: collections.length,
            itemBuilder: (context, index) {
              final collection = collections[index];
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: ListTile(
                  leading: const Icon(Icons.cloud_upload, color: Colors.orange),
                  title: Text('${collection.species} (${collection.quantity} ${collection.unit})'),
                  subtitle: Text('Captured on ${collection.harvestDate}'),
                  trailing: IconButton(
                    icon: const Icon(Icons.refresh),
                    onPressed: () {
                      // Trigger manual retry for this item
                    },
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
