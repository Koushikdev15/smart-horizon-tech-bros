import 'package:go_router/go_router.dart';
import 'package:herbchain_app/features/authentication/presentation/screens/splash_screen.dart';
import 'package:herbchain_app/features/authentication/presentation/screens/login_screen.dart';
import 'package:herbchain_app/features/authentication/presentation/screens/register_screen.dart';
import 'package:herbchain_app/core/common/main_screen.dart';
import 'package:herbchain_app/features/collection/presentation/screens/create_collection_screen.dart';
import 'package:herbchain_app/features/offline/presentation/screens/offline_queue_screen.dart';
import 'package:herbchain_app/features/collection/presentation/screens/collection_history_screen.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/home',
      builder: (context, state) => const MainScreen(),
    ),
    GoRoute(
      path: '/create_collection',
      builder: (context, state) => const CreateCollectionScreen(),
    ),
    GoRoute(
      path: '/offline_queue',
      builder: (context, state) => const OfflineQueueScreen(),
    ),
    GoRoute(
      path: '/collection_history',
      builder: (context, state) => const CollectionHistoryScreen(),
    ),
  ],
);
