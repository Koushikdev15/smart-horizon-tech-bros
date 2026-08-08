import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// AyuTrace+ brand mark, ported 1:1 from herbchain_web's `LogoMark` SVG
/// (botanical leaf + blockchain node motifs) so the app matches the web
/// portal's official monogram exactly.
class AppLogoMark extends StatelessWidget {
  const AppLogoMark({super.key, this.size = 40, this.glow = false});

  final double size;
  final bool glow;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: glow
          ? BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF14B8A6).withValues(alpha: 0.35),
                  blurRadius: size * 0.5,
                  spreadRadius: size * 0.02,
                ),
              ],
            )
          : null,
      child: CustomPaint(size: Size(size, size), painter: _LogoMarkPainter()),
    );
  }
}

class _LogoMarkPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 100, size.height / 100);

    final stroke = Paint()..style = PaintingStyle.stroke;
    final fill = Paint()..style = PaintingStyle.fill;

    // Outer green circular border.
    canvas.drawCircle(
      const Offset(50, 50),
      44,
      stroke
        ..color = const Color(0xFF0F766E)
        ..strokeWidth = 3,
    );

    // Inner dashed ring.
    _drawDashedCircle(canvas, const Offset(50, 50), 40, const Color(0xFF0D9488).withValues(alpha: 0.6), 0.8);

    // Gold accent arc across the top.
    canvas.drawArc(
      Rect.fromCircle(center: const Offset(50, 50), radius: 34),
      math.pi,
      math.pi,
      false,
      stroke
        ..color = const Color(0xFFF59E0B).withValues(alpha: 0.7)
        ..strokeWidth = 1.2,
    );

    // Bottom gold stand base.
    final standPath = Path()
      ..moveTo(36, 84.5)
      ..cubicTo(42, 87.5, 58, 87.5, 64, 84.5);
    canvas.drawPath(
      standPath,
      stroke
        ..color = const Color(0xFFF59E0B)
        ..strokeWidth = 3
        ..strokeCap = StrokeCap.round,
    );
    canvas.drawLine(
      const Offset(30, 82.5),
      const Offset(70, 82.5),
      stroke
        ..color = const Color(0xFFF59E0B).withValues(alpha: 0.6)
        ..strokeWidth = 1
        ..strokeCap = StrokeCap.butt,
    );

    // Dark green bowl.
    final bowlPath = Path()
      ..moveTo(28, 65)
      ..cubicTo(28, 80, 72, 80, 72, 65)
      ..close();
    canvas.drawPath(bowlPath, fill..color = const Color(0xFF0F766E));

    // Center leaf halves.
    final leafLeft = Path()
      ..moveTo(50, 25)
      ..cubicTo(40, 37, 47, 62, 50, 62)
      ..close();
    canvas.drawPath(leafLeft, fill..color = const Color(0xFF14B8A6));

    final leafRight = Path()
      ..moveTo(50, 25)
      ..cubicTo(60, 37, 53, 62, 50, 62)
      ..close();
    canvas.drawPath(leafRight, fill..color = const Color(0xFF0F766E));

    // Side leaves.
    final sideLeafPaint = fill..color = const Color(0xFF0F766E);
    final leftLeaf = Path()
      ..moveTo(50, 50)
      ..cubicTo(35, 40, 24, 45, 24, 55)
      ..cubicTo(24, 60, 38, 60, 50, 50)
      ..close();
    canvas.drawPath(leftLeaf, sideLeafPaint);

    final rightLeaf = Path()
      ..moveTo(50, 50)
      ..cubicTo(65, 40, 76, 45, 76, 55)
      ..cubicTo(76, 60, 62, 60, 50, 50)
      ..close();
    canvas.drawPath(rightLeaf, sideLeafPaint);

    // Leaf veins.
    final veinPaint = stroke
      ..color = Colors.white.withValues(alpha: 0.4)
      ..strokeWidth = 0.8
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(const Offset(50, 25), const Offset(50, 62), veinPaint);
    canvas.drawPath(
      Path()
        ..moveTo(50, 48)
        ..quadraticBezierTo(40, 45, 32, 49),
      stroke
        ..color = Colors.white.withValues(alpha: 0.3)
        ..strokeWidth = 0.6,
    );
    canvas.drawPath(
      Path()
        ..moveTo(50, 48)
        ..quadraticBezierTo(60, 45, 68, 49),
      stroke
        ..color = Colors.white.withValues(alpha: 0.3)
        ..strokeWidth = 0.6,
    );

    // Blockchain chain line.
    final chainPath = Path()
      ..moveTo(9, 48)
      ..cubicTo(20, 62, 35, 68, 50, 68)
      ..cubicTo(65, 68, 80, 62, 91, 48);
    canvas.drawPath(
      chainPath,
      stroke
        ..color = const Color(0xFF14B8A6)
        ..strokeWidth = 2.2
        ..strokeCap = StrokeCap.round,
    );

    // Blockchain nodes.
    _node(canvas, const Offset(26, 60), 3.2, const Color(0xFF14B8A6), 2.5);
    _node(canvas, const Offset(50, 68), 3.2, const Color(0xFFF59E0B), 2.5);
    _node(canvas, const Offset(74, 60), 3.2, const Color(0xFF14B8A6), 2.5);
    _node(canvas, const Offset(9, 48), 2.8, const Color(0xFF14B8A6), 2);
    _node(canvas, const Offset(91, 48), 2.8, const Color(0xFF14B8A6), 2);

    canvas.restore();
  }

  void _node(Canvas canvas, Offset center, double radius, Color strokeColor, double strokeWidth) {
    canvas.drawCircle(center, radius, Paint()..color = Colors.white);
    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..style = PaintingStyle.stroke
        ..color = strokeColor
        ..strokeWidth = strokeWidth,
    );
  }

  void _drawDashedCircle(Canvas canvas, Offset center, double radius, Color color, double strokeWidth) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..color = color
      ..strokeWidth = strokeWidth;
    const dashDeg = 6.0; // ~2 unit dash at r=40
    const gapDeg = 6.0;
    var angle = 0.0;
    while (angle < 360) {
      final start = angle * math.pi / 180;
      canvas.drawArc(Rect.fromCircle(center: center, radius: radius), start, dashDeg * math.pi / 180, false, paint);
      angle += dashDeg + gapDeg;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Full lockup: mark + "AyuTrace+" wordmark, mirroring web's `Logo` component.
class AppLogo extends StatelessWidget {
  const AppLogo({
    super.key,
    this.markSize = 36,
    this.wordmarkSize = 20,
    this.showWordmark = true,
    this.subtitle,
    this.glow = false,
    this.wordmarkColor,
  });

  final double markSize;
  final double wordmarkSize;
  final bool showWordmark;
  final String? subtitle;
  final bool glow;
  final Color? wordmarkColor;

  @override
  Widget build(BuildContext context) {
    final baseColor = wordmarkColor ?? Theme.of(context).colorScheme.onSurface;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(markSize * 0.28),
          child: AppLogoMark(size: markSize, glow: glow),
        ),
        if (showWordmark) ...[
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              RichText(
                text: TextSpan(
                  style: GoogleFonts.plusJakartaSans(fontSize: wordmarkSize, fontWeight: FontWeight.w800, letterSpacing: -0.4),
                  children: [
                    const TextSpan(text: 'Ayu', style: TextStyle(color: Color(0xFF14B8A6))),
                    TextSpan(text: 'Trace', style: TextStyle(color: baseColor)),
                    const TextSpan(text: '+', style: TextStyle(color: Color(0xFFF59E0B))),
                  ],
                ),
              ),
              if (subtitle != null)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(
                    subtitle!.toUpperCase(),
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1.4,
                      color: baseColor.withValues(alpha: 0.6),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ],
    );
  }
}
