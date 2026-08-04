import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:herbchain_app/core/network/api_client.dart';
import 'package:herbchain_app/core/storage/secure_storage_service.dart';
import 'package:herbchain_app/features/authentication/data/auth_repository.dart';
import 'package:herbchain_app/core/models/user_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ApiClient(), SecureStorageService());
});

final authStateProvider = AsyncNotifierProvider<AuthNotifier, User?>(() => AuthNotifier());

class AuthNotifier extends AsyncNotifier<User?> {
  late final AuthRepository _repository;

  @override
  FutureOr<User?> build() {
    _repository = ref.watch(authRepositoryProvider);
    return null;
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final user = await _repository.login(email, password);
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
  
  Future<void> register(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      final user = await _repository.register(data);
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> logout() async {
    state = const AsyncValue.loading();
    await _repository.logout();
    state = const AsyncValue.data(null);
  }
}
