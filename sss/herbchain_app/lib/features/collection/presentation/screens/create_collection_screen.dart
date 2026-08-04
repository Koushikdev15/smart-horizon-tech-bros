import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:uuid/uuid.dart';
import 'package:intl/intl.dart';
import 'package:herbchain_app/core/models/offline_collection.dart';
import 'package:herbchain_app/features/collection/providers/collection_provider.dart';
import 'package:go_router/go_router.dart';

class CreateCollectionScreen extends ConsumerStatefulWidget {
  const CreateCollectionScreen({super.key});

  @override
  ConsumerState<CreateCollectionScreen> createState() => _CreateCollectionScreenState();
}

class _CreateCollectionScreenState extends ConsumerState<CreateCollectionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _speciesController = TextEditingController();
  final _quantityController = TextEditingController();
  final _remarksController = TextEditingController();
  String _unit = 'kg';
  final String _collectionMethod = 'Hand Picked';
  final String _initialQuality = 'Good';

  Position? _currentPosition;
  bool _isLocating = false;
  final List<XFile> _images = [];
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _getLocation();
  }

  Future<void> _getLocation() async {
    setState(() => _isLocating = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) throw Exception('Location services are disabled.');

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) throw Exception('Location permissions are denied');
      }
      
      if (permission == LocationPermission.deniedForever) {
        throw Exception('Location permissions are permanently denied');
      } 

      Position position = await Geolocator.getCurrentPosition();
      setState(() {
        _currentPosition = position;
        _isLocating = false;
      });
    } catch (e) {
      setState(() => _isLocating = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  Future<void> _pickImage() async {
    if (_images.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Maximum 5 images allowed')));
      return;
    }
    
    final XFile? image = await _picker.pickImage(source: ImageSource.camera, imageQuality: 70);
    if (image != null) {
      setState(() {
        _images.add(image);
      });
    }
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      if (_currentPosition == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('GPS Location is required')));
        return;
      }
      if (_images.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('At least one image is required')));
        return;
      }

      final now = DateTime.now();
      
      final collection = OfflineCollection(
        id: const Uuid().v4(),
        species: _speciesController.text,
        quantity: double.parse(_quantityController.text),
        unit: _unit,
        harvestDate: DateFormat('yyyy-MM-dd').format(now),
        harvestTime: DateFormat('HH:mm').format(now),
        latitude: _currentPosition!.latitude,
        longitude: _currentPosition!.longitude,
        gpsAccuracy: _currentPosition!.accuracy,
        collectionMethod: _collectionMethod,
        initialQuality: _initialQuality,
        remarks: _remarksController.text,
        imagePaths: _images.map((e) => e.path).toList(),
        syncStatus: 'pending',
        retryCount: 0,
        createdTime: now.toIso8601String(),
      );

      ref.read(collectionSubmissionProvider.notifier).submit(collection).then((_) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Collection saved!')));
        context.pop();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final submissionState = ref.watch(collectionSubmissionProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('New Collection')),
      body: submissionState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  TextFormField(
                    controller: _speciesController,
                    decoration: const InputDecoration(labelText: 'Herb Species', prefixIcon: Icon(Icons.grass)),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: TextFormField(
                          controller: _quantityController,
                          decoration: const InputDecoration(labelText: 'Quantity', prefixIcon: Icon(Icons.scale)),
                          keyboardType: TextInputType.number,
                          validator: (v) {
                            if (v!.isEmpty) return 'Required';
                            if (double.tryParse(v) == null || double.parse(v) <= 0) return 'Invalid';
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        flex: 1,
                        child: DropdownButtonFormField<String>(
                          value: _unit,
                          decoration: const InputDecoration(labelText: 'Unit'),
                          items: ['kg', 'g', 'lbs'].map((u) => DropdownMenuItem(value: u, child: Text(u))).toList(),
                          onChanged: (v) => setState(() => _unit = v!),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('GPS Location', style: Theme.of(context).textTheme.titleLarge),
                              IconButton(icon: const Icon(Icons.refresh), onPressed: _getLocation),
                            ],
                          ),
                          const SizedBox(height: 8),
                          if (_isLocating) const Center(child: CircularProgressIndicator())
                          else if (_currentPosition != null) 
                            Text('Lat: ${_currentPosition!.latitude.toStringAsFixed(4)}\nLng: ${_currentPosition!.longitude.toStringAsFixed(4)}\nAccuracy: ${_currentPosition!.accuracy.toStringAsFixed(2)}m')
                          else const Text('GPS unavailable', style: TextStyle(color: Colors.red)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Photos (${_images.length}/5)', style: Theme.of(context).textTheme.titleLarge),
                              IconButton(icon: const Icon(Icons.camera_alt), onPressed: _pickImage),
                            ],
                          ),
                          const SizedBox(height: 8),
                          if (_images.isEmpty) const Text('No images captured (Min 1 required)', style: TextStyle(color: Colors.red)),
                          if (_images.isNotEmpty)
                            SizedBox(
                              height: 100,
                              child: ListView.builder(
                                scrollDirection: Axis.horizontal,
                                itemCount: _images.length,
                                itemBuilder: (context, index) {
                                  return Padding(
                                    padding: const EdgeInsets.only(right: 8),
                                    child: Stack(
                                      children: [
                                        Container(
                                          width: 100,
                                          height: 100,
                                          color: Colors.grey[300],
                                          child: const Icon(Icons.image),
                                        ),
                                        Positioned(
                                          right: 0,
                                          top: 0,
                                          child: IconButton(
                                            icon: const Icon(Icons.close, color: Colors.red),
                                            onPressed: () {
                                              setState(() => _images.removeAt(index));
                                            },
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _submit,
                    child: const Text('Save Collection'),
                  ),
                ],
              ),
            ),
    );
  }
}
