import 'package:flutter/material.dart';

/// Faint corner leaf-branch decorations, ported from herbchain_web's
/// `BotanicalBackground` (`AyurvedicBranch` SVG path) — the same low-opacity
/// teal/sage botanical accents framing the login screen.
class BotanicalBackground extends StatelessWidget {
  const BotanicalBackground({super.key});

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Stack(
        children: [
          Positioned(
            left: -48,
            top: -48,
            child: Transform.rotate(
              angle: 40 * 3.14159 / 180,
              child: CustomPaint(size: const Size(220, 220), painter: _BranchPainter(color: const Color(0xFF0F766E), opacity: 0.14)),
            ),
          ),
          Positioned(
            right: -48,
            bottom: -48,
            child: Transform.rotate(
              angle: -100 * 3.14159 / 180,
              child: CustomPaint(size: const Size(220, 220), painter: _BranchPainter(color: const Color(0xFF94A3B8), opacity: 0.16)),
            ),
          ),
        ],
      ),
    );
  }
}

class _BranchPainter extends CustomPainter {
  _BranchPainter({required this.color, required this.opacity});
  final Color color;
  final double opacity;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 200, size.height / 200);
    final fill = Paint()
      ..style = PaintingStyle.fill
      ..color = color.withValues(alpha: opacity);
    final stroke = Paint()
      ..style = PaintingStyle.stroke
      ..color = color.withValues(alpha: opacity)
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;

    canvas.drawPath(
      Path()
        ..moveTo(100, 190)
        ..cubicTo(100, 150, 110, 80, 140, 10),
      stroke,
    );

    canvas.drawPath(Path()..moveTo(140, 10)..cubicTo(138, 2, 120, 1, 115, 15)..cubicTo(112, 25, 130, 20, 140, 10)..close(), fill);
    canvas.drawPath(Path()..moveTo(130, 45)..cubicTo(115, 40, 85, 45, 95, 65)..cubicTo(102, 78, 122, 65, 130, 45)..close(), fill);
    canvas.drawPath(Path()..moveTo(132, 40)..cubicTo(148, 35, 178, 40, 168, 60)..cubicTo(161, 73, 140, 60, 132, 40)..close(), fill);
    canvas.drawPath(Path()..moveTo(120, 90)..cubicTo(100, 85, 70, 95, 80, 115)..cubicTo(88, 128, 110, 115, 120, 90)..close(), fill);
    canvas.drawPath(Path()..moveTo(122, 85)..cubicTo(142, 80, 172, 90, 162, 110)..cubicTo(154, 123, 132, 115, 122, 85)..close(), fill);
    canvas.drawPath(Path()..moveTo(110, 135)..cubicTo(90, 132, 60, 145, 70, 165)..cubicTo(78, 177, 100, 160, 110, 135)..close(), fill);
    canvas.drawPath(Path()..moveTo(112, 130)..cubicTo(132, 125, 162, 138, 152, 158)..cubicTo(144, 170, 122, 155, 112, 130)..close(), fill);

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
