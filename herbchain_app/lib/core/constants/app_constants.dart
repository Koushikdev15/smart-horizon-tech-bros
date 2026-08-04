class AppConstants {
  // App
  static const String appName = 'HerbChain AI';
  static const String appVersion = '1.0.0';

  // API Endpoints
  static const String loginEndpoint = '/auth/login';
  static const String registerEndpoint = '/auth/register';
  static const String profileEndpoint = '/profile';
  static const String collectionEndpoint = '/collection';
  static const String notificationsEndpoint = '/notifications';
  static const String syncEndpoint = '/sync';

  // Storage Keys
  static const String jwtKey = 'jwt_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userRoleKey = 'user_role';

  // Roles
  static const String roleFarmer = 'Farmer';
  static const String roleCollector = 'Wild Collector';
}
