import React from 'react';

const OrbitingCircle = ({ 
  isCracked, 
  personality,
  icon, // Receive the icon prop
  delay = 0, 
  radius = 120, 
  speed = 8, 
  onOrbHover, 
  onOrbLeave,
  onOrbClick,
  isHovered, 
  isDimmed 
}) => {
  
  return (
    <div 
      className={`absolute top-1/2 left-1/2 pointer-events-none animate-orbit ${isHovered ? 'z-50' : 'z-20'}`}
      style={{ 
        animationDuration: `${speed}s`,
        animationDelay: `-${delay}s` 
      }}
    >
      <div 
        className="transition-transform duration-1000 ease-in-out"
        style={{
          transform: `translateX(${isCracked ? `${radius}px` : '0px'})`
        }}
      >
        <div 
          title={personality}
          className={`
            w-10 h-10 rounded-full shadow-[0_0_15px_white] 
            transition-all duration-300 ease-out cursor-pointer pointer-events-auto overflow-hidden
            ${icon ? 'bg-black/20' : 'bg-white'} /* Transparent bg if icon exists */
            
            /* Visibility States */
            ${!isCracked ? 'opacity-0 scale-0' : ''}
            ${isCracked && isDimmed ? 'opacity-30 scale-100' : ''}
            
            /* Default State (NO BLUR now, as requested) */
            ${isCracked && !isDimmed && !isHovered ? 'opacity-100 scale-200' : ''}
            
            /* Hover State */
            ${isHovered ? 'scale-[2.5] shadow-[0_0_30px_white] z-50' : ''} 
          `}
          onMouseEnter={(e) => {
            e.stopPropagation();
            onOrbHover && onOrbHover();
          }}
          onMouseLeave={(e) => {
            e.stopPropagation();
            onOrbLeave && onOrbLeave();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onOrbClick && onOrbClick();
          }}
        >
          {/* Render the Icon with Counter-Rotation */}
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

export default OrbitingCircle;