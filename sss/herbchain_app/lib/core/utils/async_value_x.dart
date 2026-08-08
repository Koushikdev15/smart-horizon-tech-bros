import 'package:flutter_riverpod/flutter_riverpod.dart';

/// riverpod 3.x dropped the convenience `valueOrNull` getter from
/// [AsyncValue]; this restores it for read-only UI peeks.
extension AsyncValueX<T> on AsyncValue<T> {
  T? get valueOrNull => when(
        data: (v) => v,
        loading: () => null,
        error: (_, _) => null,
      );
}
