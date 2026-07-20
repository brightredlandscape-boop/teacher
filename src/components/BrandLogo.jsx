import React from 'react';

export default function BrandLogo({ light = false, className = '', iconOnly = false }) {
  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      {/* Emblem Circle */}
      <svg 
        viewBox="0 0 200 200" 
        className="h-full w-auto aspect-square flex-shrink-0 hover:rotate-12 transition-transform duration-300"
        aria-hidden="true"
      >
        <circle 
          cx="100" 
          cy="100" 
          r="90" 
          fill="#2E4036" 
          stroke={light ? "rgba(242, 240, 233, 0.25)" : "rgba(46, 64, 54, 0.15)"} 
          strokeWidth="4" 
        />
        <path 
          d="M 45 100 C 45 60, 100 60, 100 100 C 100 140, 155 140, 155 100" 
          stroke="#CC5833" 
          strokeWidth="14" 
          strokeLinecap="round" 
          fill="none" 
        />
        <circle cx="72.5" cy="46" r="14" fill="#F2F0E9" />
        <circle cx="127.5" cy="104" r="14" fill="#F2F0E9" />
      </svg>

      {!iconOnly && (
        <>
          {/* Vertical divider line with top and bottom serifs/ticks */}
          <svg 
            viewBox="0 0 12 60" 
            className={`h-full w-auto aspect-[12/60] flex-shrink-0 ${light ? 'text-white/70' : 'text-brand-charcoal/50'}`} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M 2 6 L 10 6" />
            <path d="M 6 6 L 6 54" />
            <path d="M 2 54 L 10 54" />
          </svg>

          {/* Text branding */}
          <div className="flex flex-col select-none leading-none justify-center">
            <span className={`font-heading font-black text-lg md:text-xl lg:text-2xl tracking-tight uppercase ${light ? 'text-white' : 'text-brand-charcoal'}`}>
              EDUVISTA
            </span>
            <span className={`font-heading font-bold text-[10px] md:text-[11px] lg:text-[12px] tracking-[0.28em] uppercase mt-1 ${light ? 'text-brand-cream/80' : 'text-brand-charcoal/70'}`}>
              AFRICA
            </span>
          </div>
        </>
      )}
    </div>
  );
}
