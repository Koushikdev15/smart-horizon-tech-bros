/**
 * AyuTrace+ brand mark.
 * Official monogram supplied for the Ministry of AYUSH presentation build —
 * featuring botanical (leaf) and blockchain (network nodes) motifs in SVG.
 */
export function LogoMark({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Outer green circular border */}
      <circle cx="50" cy="50" r="44" stroke="#0F766E" strokeWidth="3" />
      
      {/* Inner dotted line */}
      <circle cx="50" cy="50" r="40" stroke="#0D9488" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
      
      {/* Left/Right gold accent rings */}
      <path d="M16 50 A 34 34 0 0 1 84 50" stroke="#F59E0B" strokeWidth="1.2" fill="none" opacity="0.7" />
      
      {/* Bottom gold stand base */}
      <path d="M36 84.5 C 42 87.5, 58 87.5, 64 84.5" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M30 82.5 L 70 82.5" stroke="#F59E0B" strokeWidth="1" opacity="0.6" />

      {/* Dark Green Bowl */}
      <path d="M28 65 C 28 80, 72 80, 72 65 Z" fill="#0F766E" />

      {/* Leaves */}
      {/* Center leaf left half (Emerald Teal) */}
      <path d="M50 25 C 40 37, 47 62, 50 62 Z" fill="#14B8A6" />
      {/* Center leaf right half (Teal) */}
      <path d="M50 25 C 60 37, 53 62, 50 62 Z" fill="#0F766E" />

      {/* Left leaf (Teal) */}
      <path d="M50 50 C 35 40, 24 45, 24 55 C 24 60, 38 60, 50 50 Z" fill="#0F766E" />

      {/* Right leaf (Teal) */}
      <path d="M50 50 C 65 40, 76 45, 76 55 C 76 60, 62 60, 50 50 Z" fill="#0F766E" />

      {/* Leaf veins */}
      <path d="M50 25 L 50 62" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
      <path d="M50 48 Q 40 45 32 49" stroke="#ffffff" strokeWidth="0.6" opacity="0.3" fill="none" />
      <path d="M50 48 Q 60 45 68 49" stroke="#ffffff" strokeWidth="0.6" opacity="0.3" fill="none" />

      {/* Blockchain curved chain line */}
      <path d="M9 48 C 20 62, 35 68, 50 68 C 65 68, 80 62, 91 48" stroke="#14B8A6" strokeWidth="2.2" fill="none" />

      {/* Blockchain Nodes */}
      {/* Node Left-mid */}
      <circle cx="26" cy="60" r="3.2" fill="#ffffff" stroke="#14B8A6" strokeWidth="2.5" />
      {/* Node Center */}
      <circle cx="50" cy="68" r="3.2" fill="#ffffff" stroke="#F59E0B" strokeWidth="2.5" />
      {/* Node Right-mid */}
      <circle cx="74" cy="60" r="3.2" fill="#ffffff" stroke="#14B8A6" strokeWidth="2.5" />

      {/* Left/Right outer connection circles */}
      <circle cx="9" cy="48" r="2.8" fill="#ffffff" stroke="#14B8A6" strokeWidth="2" />
      <circle cx="91" cy="48" r="2.8" fill="#ffffff" stroke="#14B8A6" strokeWidth="2" />
    </svg>
  );
}

export default function Logo({
  className = '',
  markClassName = 'w-9 h-9',
  showWordmark = true,
  subtitle,
  wordmarkClassName = 'text-lg',
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  subtitle?: string;
  wordmarkClassName?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${markClassName} shrink-0 rounded-[10px] overflow-hidden border border-border/50 elevate-sm`}>
        <LogoMark className={`${markClassName} rounded-none`} />
      </div>
      {showWordmark && (
        <div className="leading-tight">
          <span className={`font-heading font-bold tracking-tight text-foreground ${wordmarkClassName}`}>
            <span className="text-[#14B8A6]">Ayu</span>Trace<span className="text-[#F59E0B]">+</span>
          </span>
          {subtitle && <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mt-0.5">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
