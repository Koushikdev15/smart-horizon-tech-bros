import 'package:dio/dio.dart';
import 'package:herbchain_app/core/network/api_client.dart';
import 'package:herbchain_app/core/constants/app_constants.dart';
import 'package:herbchain_app/core/storage/secure_storage_service.dart';
import 'package:herbchain_app/core/models/user_model.dart';

class AuthRepository {
  final ApiClient _apiClient;
  final SecureStorageService _storageService;

  AuthRepository(this._apiClient, this._storageService);

  Future<User> login(String email, String password) async {
    try {
      final response = await _apiClient.dio.post(
        AppConstants.loginEndpoint,
        data: {'email': email, 'password': password},
      );
      
      final token = response.data['data']['token'];
      final userRole = response.data['data']['user']['role'];
      
      await _storageService.saveToken(token);
      await _storageService.saveUserRole(userRole);
      
      return User.fromJson(response.data['data']['user']);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Login failed');
    }
  }

  Future<User> register(Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.dio.post(
        AppConstants.registerEndpoint,
        data: data,
      );
      
      final token = response.data['data']['token'] ?? '';
      final userRole = response.data['data']['user']['role'];
      
      if (token.isNotEmpty) {
        await _storageService.saveToken(token);
      }
      await _storageService.saveUserRole(userRole);
      
      return User.fromJson(response.data['data']['user']);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Registration failed');
    }
  }

  Future<void> logout() async {
    await _storageService.clearAll();
  }
}
