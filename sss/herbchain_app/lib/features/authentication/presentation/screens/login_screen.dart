import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:herbchain_app/features/authentication/providers/auth_provider.dart';
import 'package:herbchain_app/core/models/user_model.dart';
import 'package:herbchain_app/core/theme/app_colors.dart';
import 'package:herbchain_app/core/widgets/app_logo.dart';
import 'package:herbchain_app/core/widgets/botanical_background.dart';
import 'package:herbchain_app/core/widgets/glow_text_field.dart';
import 'package:herbchain_app/core/widgets/gradient_button.dart';
import 'package:herbchain_app/core/widgets/theme_toggle_button.dart';

/// Two-panel layout ported from herbchain_web's Login screen (brand panel +
/// form panel inside a bordered card, botanical corner accents) — collapses
/// to a single column below `_breakpoint`, mirroring the web's own
/// `hidden lg:flex` responsive fallback.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  static const _breakpoint = 820.0;

  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _login() {
    if (_formKey.currentState!.validate()) {
      ref.read(authStateProvider.notifier).login(
            _emailController.text,
            _passwordController.text,
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    ref.listen<AsyncValue<User?>>(authStateProvider, (previous, next) {
      next.whenOrNull(
        data: (user) {
          if (user != null) context.go('/home');
        },
        error: (error, _) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
        },
      );
    });

    return Scaffold(
      body: Stack(
        children: [
          const Positioned.fill(child: BotanicalBackground()),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 980),
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final wide = constraints.maxWidth >= _breakpoint;
                      final card = DecoratedBox(
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.darkSurface : AppColors.surface,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.border),
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.08), blurRadius: 32, offset: const Offset(0, 12))],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(20),
                          child: wide
                              ? IntrinsicHeight(
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      Expanded(child: _BrandPanel(isDark: isDark)),
                                      VerticalDivider(width: 1, color: isDark ? AppColors.darkBorder : AppColors.border),
                                      Expanded(
                                        child: _FormPanel(
                                          formKey: _formKey,
                                          emailController: _emailController,
                                          passwordController: _passwordController,
                                          obscure: _obscure,
                                          onToggleObscure: () => setState(() => _obscure = !_obscure),
                                          loading: authState.isLoading,
                                          onSubmit: _login,
                                          showLogoHeader: false,
                                        ),
                                      ),
                                    ],
                                  ),
                                )
                              : _FormPanel(
                                  formKey: _formKey,
                                  emailController: _emailController,
                                  passwordController: _passwordController,
                                  obscure: _obscure,
                                  onToggleObscure: () => setState(() => _obscure = !_obscure),
                                  loading: authState.isLoading,
                                  onSubmit: _login,
                                  showLogoHeader: true,
                                ),
                        ),
                      );
                      return card.animate().fadeIn(duration: 450.ms).slideY(begin: 0.04, end: 0);
                    },
                  ),
                ),
              ),
            ),
          ),
          const Positioned(top: 20, right: 20, child: ThemeToggleButton()),
        ],
      ),
    );
  }
}

class _BrandPanel extends StatelessWidget {
  const _BrandPanel({required this.isDark});
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        gradient: RadialGradient(
          center: const Alignment(0, -0.4),
          radius: 1.1,
          colors: isDark
              ? [AppColors.darkPrimary.withValues(alpha: 0.08), AppColors.darkSurface]
              : [AppColors.primary.withValues(alpha: 0.06), AppColors.surface],
        ),
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const AppLogoMark(size: 148),
            const SizedBox(height: 24),
            RichText(
              textAlign: TextAlign.center,
              text: TextSpan(
                style: GoogleFonts.plusJakartaSans(fontSize: 32, fontWeight: FontWeight.w800, letterSpacing: -0.5),
                children: [
                  const TextSpan(text: 'Ayu', style: TextStyle(color: Color(0xFF14B8A6))),
                  TextSpan(text: 'Trace', style: TextStyle(color: isDark ? Colors.white : const Color(0xFF0F172A))),
                  const TextSpan(text: '+', style: TextStyle(color: Color(0xFFF59E0B))),
                ],
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'PROMOTING HOLISTIC WELLNESS & INNOVATION',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                letterSpacing: 2,
                color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FormPanel extends StatelessWidget {
  const _FormPanel({
    required this.formKey,
    required this.emailController,
    required this.passwordController,
    required this.obscure,
    required this.onToggleObscure,
    required this.loading,
    required this.onSubmit,
    required this.showLogoHeader,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final bool obscure;
  final VoidCallback onToggleObscure;
  final bool loading;
  final VoidCallback onSubmit;
  final bool showLogoHeader;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (showLogoHeader) ...[
              const Center(child: AppLogo(markSize: 48, wordmarkSize: 22)),
              const SizedBox(height: 28),
            ],
            Text('Sign in to your account', textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 6),
            Text(
              'Track and verify your Ayurvedic harvests',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 28),
            GlowTextField(
              label: 'Email',
              controller: emailController,
              icon: Icons.mail_outline_rounded,
              keyboardType: TextInputType.emailAddress,
              validator: (v) => (v == null || v.isEmpty) ? 'Please enter your email' : null,
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Password', style: Theme.of(context).textTheme.labelLarge),
                TextButton(
                  onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Contact your administrator to reset your password.')),
                  ),
                  style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 0)),
                  child: const Text('Forgot password?', style: TextStyle(fontSize: 12.5)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            GlowTextField(
              hint: 'Your secure password',
              controller: passwordController,
              icon: Icons.lock_outline_rounded,
              obscureText: obscure,
              suffix: IconButton(
                icon: Icon(obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20),
                onPressed: onToggleObscure,
              ),
              validator: (v) => (v == null || v.isEmpty) ? 'Please enter your password' : null,
            ),
            const SizedBox(height: 22),
            PrimaryGlowButton(label: 'Sign in', loading: loading, onPressed: onSubmit, icon: Icons.arrow_forward_rounded),
            const SizedBox(height: 16),
            Center(
              child: TextButton(
                onPressed: () => context.push('/register'),
                child: const Text('Don\'t have an account? Register'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
