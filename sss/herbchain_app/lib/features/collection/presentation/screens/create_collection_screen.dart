import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:uuid/uuid.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:herbchain_app/core/models/offline_collection.dart';
import 'package:herbchain_app/features/collection/providers/collection_provider.dart';
import 'package:herbchain_app/core/theme/app_colors.dart';
import 'package:herbchain_app/core/widgets/app_card.dart';
import 'package:herbchain_app/core/widgets/glow_text_field.dart';
import 'package:herbchain_app/core/widgets/gradient_button.dart';

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
  final _pageController = PageController();

  String _unit = 'kg';
  final String _collectionMethod = 'Hand Picked';
  final String _initialQuality = 'Good';
  int _step = 0;
  static const _stepCount = 3;
  static const _stepTitles = ['Herb Details', 'GPS Location', 'Photos & Notes'];

  Position? _currentPosition;
  bool _isLocating = false;
  final List<XFile> _images = [];
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _getLocation();
  }

  @override
  void dispose() {
    _speciesController.dispose();
    _quantityController.dispose();
    _remarksController.dispose();
    _pageController.dispose();
    super.dispose();
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
      setState(() => _images.add(image));
    }
  }

  void _goNext() {
    if (_step == 0) {
      if (_speciesController.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter the herb species')));
        return;
      }
      final qty = double.tryParse(_quantityController.text);
      if (qty == null || qty <= 0) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a valid quantity')));
        return;
      }
    }
    if (_step == 1 && _currentPosition == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('GPS location is required to continue')));
      return;
    }
    _pageController.nextPage(duration: const Duration(milliseconds: 320), curve: Curves.easeOutCubic);
  }

  void _goBack() {
    _pageController.previousPage(duration: const Duration(milliseconds: 320), curve: Curves.easeOutCubic);
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
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
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Collection saved!')));
      context.pop();
    });
  }

  @override
  Widget build(BuildContext context) {
    final submissionState = ref.watch(collectionSubmissionProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('New Collection')),
      body: submissionState.isLoading
            ? const Center(child: CircularProgressIndicator())
            : SafeArea(
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      _WizardProgress(step: _step, count: _stepCount, titles: _stepTitles),
                      Expanded(
                        child: PageView(
                          controller: _pageController,
                          physics: const NeverScrollableScrollPhysics(),
                          onPageChanged: (i) => setState(() => _step = i),
                          children: [
                            _SpeciesStep(
                              speciesController: _speciesController,
                              quantityController: _quantityController,
                              unit: _unit,
                              onUnitChanged: (v) => setState(() => _unit = v),
                            ),
                            _LocationStep(
                              isLocating: _isLocating,
                              position: _currentPosition,
                              onRefresh: _getLocation,
                            ),
                            _PhotosStep(
                              images: _images,
                              remarksController: _remarksController,
                              onPickImage: _pickImage,
                              onRemoveImage: (i) => setState(() => _images.removeAt(i)),
                            ),
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                        child: Row(
                          children: [
                            if (_step > 0)
                              Expanded(child: SecondaryGlowButton(label: 'Back', icon: Icons.arrow_back_rounded, onPressed: _goBack)),
                            if (_step > 0) const SizedBox(width: 12),
                            Expanded(
                              flex: 2,
                              child: PrimaryGlowButton(
                                label: _step == _stepCount - 1 ? 'Save Collection' : 'Next',
                                icon: _step == _stepCount - 1 ? Icons.cloud_upload_rounded : Icons.arrow_forward_rounded,
                                onPressed: _step == _stepCount - 1 ? _submit : _goNext,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
    );
  }
}

class _WizardProgress extends StatelessWidget {
  const _WizardProgress({required this.step, required this.count, required this.titles});

  final int step;
  final int count;
  final List<String> titles;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(titles[step], style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          Row(
            children: List.generate(count, (i) {
              final active = i <= step;
              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: i == count - 1 ? 0 : 8),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 260),
                    height: 5,
                    decoration: BoxDecoration(
                      color: active ? AppColors.darkPrimary : Colors.white.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(100),
                    ),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

class _SpeciesStep extends StatelessWidget {
  const _SpeciesStep({
    required this.speciesController,
    required this.quantityController,
    required this.unit,
    required this.onUnitChanged,
  });

  final TextEditingController speciesController;
  final TextEditingController quantityController;
  final String unit;
  final ValueChanged<String> onUnitChanged;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        GlowTextField(
          label: 'Herb Species',
          controller: speciesController,
          icon: Icons.grass_rounded,
          validator: (v) => v!.isEmpty ? 'Required' : null,
        ),
        const SizedBox(height: 18),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 2,
              child: GlowTextField(
                label: 'Quantity',
                controller: quantityController,
                icon: Icons.scale_rounded,
                keyboardType: TextInputType.number,
                validator: (v) {
                  if (v!.isEmpty) return 'Required';
                  if (double.tryParse(v) == null || double.parse(v) <= 0) return 'Invalid';
                  return null;
                },
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Wrap(
                spacing: 8,
                children: ['kg', 'g', 'lbs'].map((u) {
                  final selected = u == unit;
                  return ChoiceChip(
                    label: Text(u),
                    selected: selected,
                    onSelected: (_) => onUnitChanged(u),
                    selectedColor: AppColors.darkPrimary.withValues(alpha: 0.22),
                    labelStyle: TextStyle(
                      color: selected ? AppColors.darkPrimary : AppColors.darkTextSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                    side: BorderSide(color: selected ? AppColors.darkPrimary : AppColors.darkBorder),
                    shape: const StadiumBorder(),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ],
    ).animate().fadeIn(duration: 300.ms);
  }
}

class _LocationStep extends StatelessWidget {
  const _LocationStep({required this.isLocating, required this.position, required this.onRefresh});

  final bool isLocating;
  final Position? position;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        AppCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(children: [
                    const Icon(Icons.my_location_rounded, color: AppColors.darkPrimary, size: 20),
                    const SizedBox(width: 8),
                    Text('GPS Location', style: Theme.of(context).textTheme.titleMedium),
                  ]),
                  IconButton(
                    icon: const Icon(Icons.refresh_rounded),
                    onPressed: onRefresh,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (isLocating)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (position != null)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _CoordRow(label: 'Latitude', value: position!.latitude.toStringAsFixed(5)),
                    _CoordRow(label: 'Longitude', value: position!.longitude.toStringAsFixed(5)),
                    _CoordRow(label: 'Accuracy', value: '±${position!.accuracy.toStringAsFixed(1)}m'),
                  ],
                )
              else
                const Text('GPS unavailable — tap refresh to retry', style: TextStyle(color: AppColors.darkError)),
            ],
          ),
        ),
      ],
    ).animate().fadeIn(duration: 300.ms);
  }
}

class _CoordRow extends StatelessWidget {
  const _CoordRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w700, fontFamily: 'monospace')),
        ],
      ),
    );
  }
}

class _PhotosStep extends StatelessWidget {
  const _PhotosStep({
    required this.images,
    required this.remarksController,
    required this.onPickImage,
    required this.onRemoveImage,
  });

  final List<XFile> images;
  final TextEditingController remarksController;
  final VoidCallback onPickImage;
  final ValueChanged<int> onRemoveImage;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        AppCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Photos (${images.length}/5)', style: Theme.of(context).textTheme.titleMedium),
                  IconButton(icon: const Icon(Icons.camera_alt_rounded), onPressed: onPickImage),
                ],
              ),
              const SizedBox(height: 8),
              if (images.isEmpty)
                const Text('No images captured (min. 1 required)', style: TextStyle(color: AppColors.darkError))
              else
                SizedBox(
                  height: 96,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: images.length,
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.only(right: 10),
                        child: Stack(
                          children: [
                            Container(
                              width: 88,
                              height: 88,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.06),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.darkBorder),
                              ),
                              child: const Icon(Icons.image_rounded, color: AppColors.darkTextSecondary),
                            ),
                            Positioned(
                              right: -6,
                              top: -6,
                              child: GestureDetector(
                                onTap: () => onRemoveImage(index),
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: const BoxDecoration(color: AppColors.darkError, shape: BoxShape.circle),
                                  child: const Icon(Icons.close_rounded, color: Colors.white, size: 14),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ).animate().scale(duration: 220.ms, curve: Curves.easeOutBack);
                    },
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        GlowTextField(label: 'Remarks (optional)', controller: remarksController, icon: Icons.notes_rounded, maxLines: 3),
      ],
    ).animate().fadeIn(duration: 300.ms);
  }
}
