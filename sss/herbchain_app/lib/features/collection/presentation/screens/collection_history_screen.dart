import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:herbchain_app/features/collection/providers/collection_provider.dart';
import 'package:go_router/go_router.dart';

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
            return const Center(child: Text('No collections found.'));
          }
          return ListView.builder(
            itemCount: collections.length,
            itemBuilder: (context, index) {
              final col = collections[index];
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: ListTile(
                  title: Text('${col['species']} (${col['quantity']} ${col['unit']})'),
                  subtitle: Text('Status: ${col['blockchainStatus'] ?? col['status']}'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    // Navigate to details
                  },
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
