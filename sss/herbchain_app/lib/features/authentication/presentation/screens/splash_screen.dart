import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:herbchain_app/core/storage/secure_storage_service.dart';
import 'package:herbchain_app/core/theme/app_colors.dart';
import 'package:herbchain_app/core/widgets/app_logo.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(milliseconds: 1800));
    final storage = SecureStorageService();
    final token = await storage.getToken();

    if (mounted) {
      if (token != null) {
        context.go('/home');
      } else {
        context.go('/login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const AppLogoMark(size: 132, glow: true)
                  .animate()
                  .scale(begin: const Offset(0.7, 0.7), curve: Curves.easeOutBack, duration: 700.ms)
                  .fadeIn(duration: 500.ms),
              const SizedBox(height: 28),
              RichText(
                text: TextSpan(
                  style: GoogleFonts.plusJakartaSans(fontSize: 34, fontWeight: FontWeight.w800, letterSpacing: -0.6),
                  children: const [
                    TextSpan(text: 'Ayu', style: TextStyle(color: AppColors.darkPrimary)),
                    TextSpan(text: 'Trace', style: TextStyle(color: AppColors.darkTextPrimary)),
                    TextSpan(text: '+', style: TextStyle(color: AppColors.darkAccent)),
                  ],
                ),
              ).animate().fadeIn(delay: 250.ms, duration: 500.ms).slideY(begin: 0.25, end: 0),
              const SizedBox(height: 10),
              Text(
                'PROMOTING HOLISTIC WELLNESS & INNOVATION',
                style: GoogleFonts.inter(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 2.2,
                  color: AppColors.darkTextSecondary,
                ),
              ).animate().fadeIn(delay: 420.ms, duration: 500.ms),
              const SizedBox(height: 56),
              SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(strokeWidth: 2.4, color: AppColors.darkPrimary.withValues(alpha: 0.7)),
              ).animate().fadeIn(delay: 600.ms),
            ],
          ),
      ),
    );
  }
}
