import React from 'react';

// SVG 1: A multi-leaflet Ayurvedic branch (like Neem or Curry leaf)
const AyurvedicBranch = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Stem */}
    <path
      d="M100 190 C100 150 110 80 140 10"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Top leaf */}
    <path d="M140 10 C138 2 120 1 115 15 C112 25 130 20 140 10 Z" fill="currentColor" />
    {/* Left leaf 1 */}
    <path d="M130 45 C115 40 85 45 95 65 C102 78 122 65 130 45 Z" fill="currentColor" />
    {/* Right leaf 1 */}
    <path d="M132 40 C148 35 178 40 168 60 C161 73 140 60 132 40 Z" fill="currentColor" />
    {/* Left leaf 2 */}
    <path d="M120 90 C100 85 70 95 80 115 C88 128 110 115 120 90 Z" fill="currentColor" />
    {/* Right leaf 2 */}
    <path d="M122 85 C142 80 172 90 162 110 C154 123 132 115 122 85 Z" fill="currentColor" />
    {/* Left leaf 3 */}
    <path d="M110 135 C90 132 60 145 70 165 C78 177 100 160 110 135 Z" fill="currentColor" />
    {/* Right leaf 3 */}
    <path d="M112 130 C132 125 162 138 152 158 C144 170 122 155 112 130 Z" fill="currentColor" />
  </svg>
);

// SVG 2: Slender elegant fern/palm leaf
const AyurvedicFern = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Stem */}
    <path
      d="M20 180 C50 160 120 120 180 20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Leaflets */}
    <path d="M40 155 Q20 130 50 135 C70 138 60 150 40 155 Z" fill="currentColor" />
    <path d="M65 135 Q45 110 75 115 C95 118 85 130 65 135 Z" fill="currentColor" />
    <path d="M90 115 Q70 90 100 95 C120 98 110 110 90 115 Z" fill="currentColor" />
    <path d="M115 95 Q95 70 125 75 C145 78 135 90 115 95 Z" fill="currentColor" />
    <path d="M140 75 Q120 50 150 55 C170 58 160 70 140 75 Z" fill="currentColor" />
    <path d="M165 55 Q145 30 175 35 C195 38 185 50 165 55 Z" fill="currentColor" />

    <path d="M50 150 Q75 140 58 120 C45 105 45 125 50 150 Z" fill="currentColor" />
    <path d="M75 130 Q100 120 83 100 C70 85 70 105 75 130 Z" fill="currentColor" />
    <path d="M100 110 Q125 100 108 80 C95 65 95 85 100 110 Z" fill="currentColor" />
    <path d="M125 90 Q150 80 133 60 C120 45 120 65 125 90 Z" fill="currentColor" />
    <path d="M150 70 Q175 60 158 40 C145 25 145 45 150 70 Z" fill="currentColor" />
  </svg>
);

// SVG 3: Broad single leaf with elegant veins (like Tulsi or Peepal)
const AyurvedicLeafBroad = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 150 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {/* Stem */}
    <path
      d="M75 140 C75 140 75 75 115 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Blade */}
    <path d="M75 140 C35 110 25 60 75 25 C125 60 115 110 75 140 Z" fill="currentColor" />
    {/* Veins */}
    <path d="M68 115 C50 100 45 80 45 80" stroke="currentColor" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
    <path d="M63 90 C45 80 40 60 40 60" stroke="currentColor" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
    <path d="M61 65 C48 55 45 40 45 40" stroke="currentColor" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
    
    <path d="M82 115 C100 100 105 80 105 80" stroke="currentColor" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
    <path d="M87 90 C105 80 110 60 110 60" stroke="currentColor" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
    <path d="M89 65 C102 55 105 40 105 40" stroke="currentColor" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
  </svg>
);

export default function BotanicalBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 dark:hidden">
      {/* Soft radial glow behind the main content area to focus attention */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(20,184,166,0.07)_0%,transparent_65%)] dark:bg-[radial-gradient(circle_at_50%_35%,rgba(20,184,166,0.03)_0%,transparent_65%)]" />

      {/* Top Left: Muted sage/teal branch */}
      <AyurvedicBranch
        className="absolute left-[-3rem] top-[-3rem] w-48 h-48 md:w-64 md:h-64 rotate-[40deg] text-[#0F766E] opacity-[0.14]"
      />

      {/* Top Right: Elegant fern/palm leaf */}
      <AyurvedicFern
        className="absolute right-[-3rem] top-[-3rem] w-44 h-44 md:w-60 md:h-60 -rotate-[25deg] text-[#14B8A6] opacity-[0.12]"
      />

      {/* Bottom Left: Broad leaf with veins */}
      <AyurvedicLeafBroad
        className="absolute left-[-2.5rem] bottom-[-2.5rem] w-44 h-44 md:w-56 md:h-56 rotate-[55deg] text-[#16A34A] opacity-[0.13]"
      />

      {/* Bottom Right: Branch leaf angled upwards */}
      <AyurvedicBranch
        className="absolute right-[-3rem] bottom-[-3rem] w-48 h-48 md:w-64 md:h-64 -rotate-[100deg] text-[#94A3B8] opacity-[0.16]"
      />

      {/* Middle Left: Subtle small fern - hidden on mobile for clutter reduction */}
      <AyurvedicFern
        className="hidden md:block absolute left-[-2rem] top-[55%] -translate-y-1/2 w-32 h-32 rotate-[80deg] text-[#0F766E] opacity-[0.10]"
      />

      {/* Middle Right: Subtle small broad leaf - hidden on mobile */}
      <AyurvedicLeafBroad
        className="hidden md:block absolute right-[-2rem] top-[30%] -translate-y-1/2 w-28 h-28 -rotate-[115deg] text-[#14B8A6] opacity-[0.10]"
      />
    </div>
  );
}
