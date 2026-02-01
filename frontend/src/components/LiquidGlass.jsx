import React from 'react';

const LiquidGlass = ({ children, className = "", ...props }) => {
  return (
    <div className={`relative ${className}`} {...props}>
      {/* CSS/SVG FALLBACK FOR "CLEAR" LIQUID
        We remove the blur and opacity, relying on the 'turbulence' filter to 
        warp the background pixels.
      */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="clear-liquid">
            <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" />
          </filter>
        </defs>
      </svg>

      {/* The Glass Container - Now completely see-through */}
      <div 
        className="absolute inset-0 z-0 rounded-[inherit]"
        style={{
          // 1. No background color (0 alpha)
          background: 'rgba(255, 255, 255, 0.005)', 
          // 2. Minimal blur just to separate text slightly
          backdropFilter: 'blur(2px) saturate(120%)', 
          // 3. Subtle inner glow to define volume without opacity
          boxShadow: 'inset 0 0 40px rgba(255,255,255,0.05)',
        }}
      />

      {/* High-Reflectivity Edges (The only thing telling you glass is there) */}
      <div className="absolute inset-0 z-10 rounded-[inherit] pointer-events-none">
          {/* Sharp white rim highlight */}
          <div className="absolute inset-0 border border-white/20 rounded-[inherit] mix-blend-overlay"></div>
          {/* Second, softer glow rim */}
          <div className="absolute inset-0 border-[2px] border-white/5 rounded-[inherit] blur-[1px]"></div>
      </div>

      {/* Specular Glints (Light catching the surface) */}
      <div className="absolute top-8 left-8 w-32 h-32 bg-white/20 blur-[50px] rounded-full pointer-events-none mix-blend-overlay"></div>
      <div className="absolute bottom-8 right-8 w-32 h-32 bg-cyan-400/10 blur-[50px] rounded-full pointer-events-none mix-blend-color-dodge"></div>

      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
};

export default LiquidGlass;