import 'dart:convert';

class OfflineCollection {
  final String id;
  final String species;
  final double quantity;
  final String unit;
  final String harvestDate;
  final String harvestTime;
  final double latitude;
  final double longitude;
  final double gpsAccuracy;
  final String collectionMethod;
  final String initialQuality;
  final String remarks;
  final List<String> imagePaths;
  final String syncStatus;
  final int retryCount;
  final String createdTime;

  OfflineCollection({
    required this.id,
    required this.species,
    required this.quantity,
    required this.unit,
    required this.harvestDate,
    required this.harvestTime,
    required this.latitude,
    required this.longitude,
    required this.gpsAccuracy,
    required this.collectionMethod,
    required this.initialQuality,
    required this.remarks,
    required this.imagePaths,
    required this.syncStatus,
    required this.retryCount,
    required this.createdTime,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'species': species,
      'quantity': quantity,
      'unit': unit,
      'harvestDate': harvestDate,
      'harvestTime': harvestTime,
      'latitude': latitude,
      'longitude': longitude,
      'gpsAccuracy': gpsAccuracy,
      'collectionMethod': collectionMethod,
      'initialQuality': initialQuality,
      'remarks': remarks,
      'imagePaths': jsonEncode(imagePaths),
      'syncStatus': syncStatus,
      'retryCount': retryCount,
      'createdTime': createdTime,
    };
  }

  factory OfflineCollection.fromMap(Map<String, dynamic> map) {
    return OfflineCollection(
      id: map['id'],
      species: map['species'],
      quantity: (map['quantity'] as num).toDouble(),
      unit: map['unit'],
      harvestDate: map['harvestDate'],
      harvestTime: map['harvestTime'],
      latitude: (map['latitude'] as num).toDouble(),
      longitude: (map['longitude'] as num).toDouble(),
      gpsAccuracy: (map['gpsAccuracy'] as num).toDouble(),
      collectionMethod: map['collectionMethod'],
      initialQuality: map['initialQuality'],
      remarks: map['remarks'],
      imagePaths: List<String>.from(jsonDecode(map['imagePaths'])),
      syncStatus: map['syncStatus'],
      retryCount: map['retryCount'],
      createdTime: map['createdTime'],
    );
  }
}
