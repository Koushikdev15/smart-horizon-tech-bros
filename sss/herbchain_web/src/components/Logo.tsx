/**
 * AyurTrace brand assets.
 *
 * Three forms, because one asset cannot serve every size:
 *
 *   LogoMark     the emblem alone — leaves and the map of India in a ring.
 *                Legible down to ~20px, so it is what belongs beside a wordmark
 *                or in a collapsed sidebar.
 *   LogoWordmark the "ayurtrace" lettering with its TRACE | VERIFY | TRUST
 *                tagline. The real artwork, so the brand lettering is never
 *                approximated by a lookalike font.
 *   LogoLockup   the full artwork: emblem stacked over the wordmark. For hero
 *                placements only — shrunk to sidebar size it becomes a smudge.
 *
 * All three are transparent PNGs so they sit on whatever surface they are
 * placed on.
 * The ink is a deep forest green that reads well on light panels but goes muddy
 * against the dark theme's navy, so it is lifted in dark mode.
 */
import emblemImage from '@/assets/brand/ayurtrace-emblem.png';
import wordmarkImage from '@/assets/brand/ayurtrace-wordmark.png';
import lockupImage from '@/assets/brand/ayurtrace-mark.png';

const INK_LIFT = 'dark:brightness-[1.55] dark:saturate-[1.15]';

/** The emblem on its own. Use this anywhere below hero size. */
export function LogoMark({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <img
      src={emblemImage}
      alt="AyurTrace"
      className={`object-contain ${INK_LIFT} ${className}`}
    />
  );
}

/** The wordmark lettering and tagline. Pair with LogoMark on a single line. */
export function LogoWordmark({ className = 'w-40' }: { className?: string }) {
  return (
    <img
      src={wordmarkImage}
      alt="AyurTrace — Trace, Verify, Trust"
      className={`object-contain ${INK_LIFT} ${className}`}
    />
  );
}

/** The complete lockup, including wordmark and tagline. Hero use only. */
export function LogoLockup({ className = 'w-64' }: { className?: string }) {
  return (
    <img
      src={lockupImage}
      alt="AyurTrace — Trace, Verify, Trust"
      className={`object-contain ${INK_LIFT} ${className}`}
    />
  );
}

export default function Logo({
  className = '',
  markClassName = 'w-12 h-12',
  showWordmark = false,
  subtitle,
  wordmarkClassName = 'w-32',
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  subtitle?: string;
  wordmarkClassName?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${markClassName} shrink-0`}>
        <LogoMark className="w-full h-full" />
      </div>
      {showWordmark && (
        <div className="leading-tight">
          <LogoWordmark className={wordmarkClassName} />
          {subtitle && (
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
