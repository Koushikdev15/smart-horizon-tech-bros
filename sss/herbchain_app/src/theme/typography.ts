// Typographic pairing from the AyurTrace+ design system:
//   EB Garamond   → headlines, product names, "trust" statements (literary, authoritative)
//   Hanken Grotesk → body & UI (clean geometry reflecting the traceability/science side)
//
// The `family`/`size`/`weight` maps below keep their original shape so every existing
// screen keeps compiling — they now simply resolve to the new typefaces.

export const Fonts = {
  family: {
    // Body & UI — Hanken Grotesk
    regular: 'HankenGrotesk_400Regular',
    medium: 'HankenGrotesk_500Medium',
    semiBold: 'HankenGrotesk_600SemiBold',
    bold: 'HankenGrotesk_700Bold',
    // Headlines — EB Garamond
    serif: 'EBGaramond_500Medium',
    serifSemiBold: 'EBGaramond_600SemiBold',
    serifBold: 'EBGaramond_700Bold',
  },
  size: {
    xs: 12,
    sm: 13,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 48,
  },
  lineHeight: {
    xs: 16,
    sm: 18,
    md: 20,
    base: 24,
    lg: 28,
    xl: 28,
    '2xl': 32,
    '3xl': 34,
    '4xl': 40,
    '5xl': 56,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
};

/**
 * Ready-made text styles mirroring the design system's named type tokens.
 * Prefer these over assembling family/size/weight by hand.
 *
 * Note: no `fontWeight` is set alongside `fontFamily` — the weight is already
 * baked into the loaded font variant, and specifying both makes Android
 * synthesize a second bolding pass on top of an already-bold face.
 */
export const Type = {
  displayLg: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -0.96, // -0.02em
  },
  headlineLg: {
    fontFamily: Fonts.family.serif,
    fontSize: 32,
    lineHeight: 40,
  },
  headlineLgMobile: {
    fontFamily: Fonts.family.serif,
    fontSize: 28,
    lineHeight: 34,
  },
  headlineMd: {
    fontFamily: Fonts.family.serif,
    fontSize: 24,
    lineHeight: 32,
  },
  headlineSm: {
    fontFamily: Fonts.family.serif,
    fontSize: 20,
    lineHeight: 28,
  },
  bodyLg: {
    fontFamily: Fonts.family.regular,
    fontSize: 18,
    lineHeight: 28,
  },
  bodyMd: {
    fontFamily: Fonts.family.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySm: {
    fontFamily: Fonts.family.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  labelMd: {
    fontFamily: Fonts.family.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  labelCaps: {
    fontFamily: Fonts.family.semiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2, // 0.1em
    textTransform: 'uppercase' as const,
  },
};
