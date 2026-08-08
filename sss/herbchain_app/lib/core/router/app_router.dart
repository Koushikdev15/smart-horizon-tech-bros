import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:herbchain_app/features/authentication/presentation/screens/splash_screen.dart';
import 'package:herbchain_app/features/authentication/presentation/screens/login_screen.dart';
import 'package:herbchain_app/features/authentication/presentation/screens/register_screen.dart';
import 'package:herbchain_app/core/common/main_screen.dart';
import 'package:herbchain_app/features/collection/presentation/screens/create_collection_screen.dart';
import 'package:herbchain_app/features/offline/presentation/screens/offline_queue_screen.dart';
import 'package:herbchain_app/features/collection/presentation/screens/collection_history_screen.dart';

/// Fade-through transition: outgoing screen fades out slightly before the
/// incoming one fades + scales in — no harsh cuts between routes.
CustomTransitionPage<void> _fadeThroughPage(Widget child, GoRouterState state) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    child: child,
    transitionDuration: const Duration(milliseconds: 320),
    reverseTransitionDuration: const Duration(milliseconds: 260),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final fade = CurvedAnimation(parent: animation, curve: const Interval(0.3, 1, curve: Curves.easeOut));
      final scale = Tween<double>(begin: 0.98, end: 1).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut));
      return FadeTransition(
        opacity: fade,
        child: ScaleTransition(scale: scale, child: child),
      );
    },
  );
}

final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      pageBuilder: (context, state) => _fadeThroughPage(const SplashScreen(), state),
    ),
    GoRoute(
      path: '/login',
      pageBuilder: (context, state) => _fadeThroughPage(const LoginScreen(), state),
    ),
    GoRoute(
      path: '/register',
      pageBuilder: (context, state) => _fadeThroughPage(const RegisterScreen(), state),
    ),
    GoRoute(
      path: '/home',
      pageBuilder: (context, state) => _fadeThroughPage(const MainScreen(), state),
    ),
    GoRoute(
      path: '/create_collection',
      pageBuilder: (context, state) => _fadeThroughPage(const CreateCollectionScreen(), state),
    ),
    GoRoute(
      path: '/offline_queue',
      pageBuilder: (context, state) => _fadeThroughPage(const OfflineQueueScreen(), state),
    ),
    GoRoute(
      path: '/collection_history',
      pageBuilder: (context, state) => _fadeThroughPage(const CollectionHistoryScreen(), state),
    ),
  ],
);
