import 'package:dio/dio.dart';
import 'package:herbchain_app/core/network/api_client.dart';
import 'package:herbchain_app/core/constants/app_constants.dart';
import 'package:herbchain_app/core/database/database_helper.dart';
import 'package:herbchain_app/core/models/offline_collection.dart';
import 'package:sqflite/sqflite.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class CollectionRepository {
  final ApiClient _apiClient;
  final DatabaseHelper _dbHelper;
  final Connectivity _connectivity = Connectivity();

  CollectionRepository(this._apiClient, this._dbHelper);

  Future<void> submitCollection(OfflineCollection collection) async {
    final connectivityResults = await _connectivity.checkConnectivity();
    if (connectivityResults.contains(ConnectivityResult.none)) {
      await saveOffline(collection);
    } else {
      try {
        await _apiClient.dio.post(
          AppConstants.collectionEndpoint,
          data: collection.toMap(),
        );
      } catch (e) {
        // If API fails, save it offline for later sync
        await saveOffline(collection);
      }
    }
  }

  Future<void> saveOffline(OfflineCollection collection) async {
    final db = await _dbHelper.database;
    await db.insert(
      'offline_collections',
      collection.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<OfflineCollection>> getOfflineCollections() async {
    final db = await _dbHelper.database;
    final maps = await db.query('offline_collections');
    return maps.map((map) => OfflineCollection.fromMap(map)).toList();
  }

  Future<List<dynamic>> getRemoteCollections() async {
    try {
      final response = await _apiClient.dio.get(AppConstants.collectionEndpoint);
      return response.data;
    } catch (e) {
      return [];
    }
  }
}
