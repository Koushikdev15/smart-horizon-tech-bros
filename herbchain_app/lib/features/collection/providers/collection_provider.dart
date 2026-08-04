import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:herbchain_app/core/network/api_client.dart';
import 'package:herbchain_app/core/database/database_helper.dart';
import 'package:herbchain_app/features/collection/data/collection_repository.dart';
import 'package:herbchain_app/core/models/offline_collection.dart';

final collectionRepositoryProvider = Provider<CollectionRepository>((ref) {
  return CollectionRepository(ApiClient(), DatabaseHelper());
});

final offlineCollectionsProvider = FutureProvider<List<OfflineCollection>>((ref) async {
  final repo = ref.watch(collectionRepositoryProvider);
  return await repo.getOfflineCollections();
});

final remoteCollectionsProvider = FutureProvider<List<dynamic>>((ref) async {
  final repo = ref.watch(collectionRepositoryProvider);
  return await repo.getRemoteCollections();
});

final collectionSubmissionProvider = AsyncNotifierProvider<CollectionSubmissionNotifier, void>(() => CollectionSubmissionNotifier());

class CollectionSubmissionNotifier extends AsyncNotifier<void> {
  late final CollectionRepository _repository;

  @override
  FutureOr<void> build() {
    _repository = ref.watch(collectionRepositoryProvider);
  }

  Future<void> submit(OfflineCollection collection) async {
    state = const AsyncValue.loading();
    try {
      await _repository.submitCollection(collection);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}
