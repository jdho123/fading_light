import React from 'react';

const OrbitingCircle2 = ({ 
  personality,
  icon, 
  index,
  totalItems = 16,
  radius = 260, 
  speed = 40, 
  isHighlighted = false 
}) => {
  // Dynamically calculate delay: (40 / 16) = 2.5s spacing between each
  const delay = (speed / totalItems) * index;

  return (
    <div 
      className="absolute top-1/2 left-1/2 pointer-events-none animate-orbit z-20"
      style={{ 
        animationDuration: `${speed}s`,
        animationDelay: `-${delay}s` 
      }}
    >
      <div 
        className="transition-transform duration-1000 ease-in-out"
        style={{ transform: `translateX(${radius}px)` }}
      >
        <div 
          className={`
            w-20 h-20 rounded-full transition-all duration-700
            ${isHighlighted 
              ? 'shadow-[0_0_25px_#fbbf24] border-2 border-yellow-500 scale-125 z-50' 
              : 'shadow-[0_0_15px_rgba(255,255,255,0.3)] border border-white/10 opacity-40'}
            bg-black/40 overflow-hidden
          `}
        >
          {icon && (
            <img 
              src={icon} 
              alt={personality} 
              className="w-full h-full object-cover animate-counter-orbit"
              style={{ 
                animationDuration: `${speed}s`,
                animationDelay: `-${delay}s` 
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OrbitingCircle2;