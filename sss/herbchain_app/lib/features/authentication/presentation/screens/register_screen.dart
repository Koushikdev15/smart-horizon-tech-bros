import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:herbchain_app/features/authentication/providers/auth_provider.dart';
import 'package:herbchain_app/core/constants/app_constants.dart';
import 'package:herbchain_app/core/models/user_model.dart';
import 'package:herbchain_app/core/widgets/glass_card.dart';
import 'package:herbchain_app/core/widgets/glow_text_field.dart';
import 'package:herbchain_app/core/widgets/gradient_button.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _mobileController = TextEditingController();
  final _passwordController = TextEditingController();
  String _selectedRole = AppConstants.roleFarmer;
  bool _obscure = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _mobileController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _register() {
    if (_formKey.currentState!.validate()) {
      ref.read(authStateProvider.notifier).register({
        'name': _nameController.text,
        'email': _emailController.text,
        'mobile': _mobileController.text,
        'password': _passwordController.text,
        'role': _selectedRole,
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);

    ref.listen<AsyncValue<User?>>(authStateProvider, (previous, next) {
      next.whenOrNull(
        data: (user) {
          if (user != null) {
            context.go('/home');
          }
        },
        error: (error, _) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(error.toString())),
          );
        },
      );
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Join AyuTrace+',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineMedium,
                    ).animate().fadeIn(duration: 400.ms),
                    const SizedBox(height: 4),
                    Text(
                      'Start recording verified, traceable harvests',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ).animate().fadeIn(delay: 100.ms, duration: 400.ms),
                    const SizedBox(height: 28),
                    GlassCard(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          GlowTextField(
                            label: 'Full Name',
                            controller: _nameController,
                            icon: Icons.person_outline_rounded,
                            validator: (v) => (v == null || v.isEmpty) ? 'Please enter your name' : null,
                          ),
                          const SizedBox(height: 16),
                          GlowTextField(
                            label: 'Email',
                            controller: _emailController,
                            icon: Icons.mail_outline_rounded,
                            keyboardType: TextInputType.emailAddress,
                            validator: (v) => (v == null || v.isEmpty) ? 'Please enter your email' : null,
                          ),
                          const SizedBox(height: 16),
                          GlowTextField(
                            label: 'Mobile Number',
                            controller: _mobileController,
                            icon: Icons.phone_outlined,
                            keyboardType: TextInputType.phone,
                            validator: (v) => (v == null || v.isEmpty) ? 'Please enter your mobile number' : null,
                          ),
                          const SizedBox(height: 16),
                          DropdownButtonFormField<String>(
                            initialValue: _selectedRole,
                            decoration: const InputDecoration(
                              labelText: 'Role',
                              prefixIcon: Icon(Icons.work_outline_rounded),
                            ),
                            items: [AppConstants.roleFarmer, AppConstants.roleCollector]
                                .map((role) => DropdownMenuItem(value: role, child: Text(role)))
                                .toList(),
                            onChanged: (value) {
                              if (value != null) setState(() => _selectedRole = value);
                            },
                          ),
                          const SizedBox(height: 16),
                          GlowTextField(
                            label: 'Password',
                            controller: _passwordController,
                            icon: Icons.lock_outline_rounded,
                            obscureText: _obscure,
                            suffix: IconButton(
                              icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20),
                              onPressed: () => setState(() => _obscure = !_obscure),
                            ),
                            validator: (v) {
                              if (v == null || v.isEmpty) return 'Please enter your password';
                              if (v.length < 6) return 'Password must be at least 6 characters';
                              return null;
                            },
                          ),
                          const SizedBox(height: 26),
                          PrimaryGlowButton(
                            label: 'Create Account',
                            loading: authState.isLoading,
                            onPressed: _register,
                          ),
                        ],
                      ),
                    ).animate().fadeIn(delay: 160.ms, duration: 500.ms).slideY(begin: 0.08, end: 0),
                  ],
                ),
              ),
            ),
          ),
        ),
    );
  }
}


