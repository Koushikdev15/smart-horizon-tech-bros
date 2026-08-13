// All spacing derives from an 8px base unit, with generous vertical rhythm
// between major sections to carry the premium/"breathable" feel.
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
  '5xl': 80,
  gutter: 24, // mobile horizontal safe-area margin
};

// Organic curves: generous 24px radius on cards, softer 12px on buttons.
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Ambient, diffused shadows with a slight green tint (#0B3B20) — mimicking
// natural light filtered through leaves. Large blur, minimal offset, so cards
// appear to float gently rather than sit on a hard edge.
export const Shadow = {
  sm: {
    shadowColor: '#0B3B20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  md: {
    shadowColor: '#0B3B20',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0B3B20',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 8,
  },
};
