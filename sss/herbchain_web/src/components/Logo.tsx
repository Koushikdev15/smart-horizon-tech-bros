/**
 * HerbChain brand mark — a minimalist leaf connected by blockchain nodes,
 * in Emerald Green (#10B981) per the platform's dark glassmorphism design system.
 */
import logoImage from '@/assets/brand/ayurtrace-mark.png';

export function LogoMark({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <img 
      src={logoImage} 
      alt="AyuTrace Logo" 
      className={`object-contain ${className}`}
    />
  );
}

export default function Logo({
  className = '',
  markClassName = 'w-12 h-12',
  showWordmark = false,
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
      <div className={`${markClassName} shrink-0 overflow-hidden`}>
        <LogoMark className="w-full h-full" />
      </div>
      {showWordmark && (
        <div className="leading-tight">
          <span className={`font-heading font-bold tracking-tight text-foreground ${wordmarkClassName}`}>
            <span className="text-[#10B981]">Ayu</span>Trace+
          </span>
          {subtitle && <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mt-0.5">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
