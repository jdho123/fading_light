import React from 'react';

const CategoryLabel = ({ text, rotation, radius, color = "white" }) => {
  const d = `
    M ${radius * 0.707}, ${-radius * 0.707}
    A ${radius} ${radius} 0 0 1 ${radius * 0.707}, ${radius * 0.707}
  `;

  return (
    <g transform={`rotate(${rotation})`}>
      <path id={`path-${text}`} d={d} fill="none" />
      <text fill={color} fontSize="14" fontWeight="600" letterSpacing="0.2em" style={{ textTransform: 'uppercase' }}>
        <textPath href={`#path-${text}`} startOffset="50%" textAnchor="middle" side="right">
          {text}
        </textPath>
      </text>
    </g>
  );
};

const PersonalityCategories = ({ radius = 360, speed = 64, isVisible = false }) => {
  const size = radius * 2 + 100; 

  return (
    <div 
      // UPDATED: Changed to transition-opacity and removed scale classes.
      // Now it simply fades in/out without shrinking or collapsing.
      className={`absolute top-1/2 left-1/2 pointer-events-none animate-orbit z-10 
                  transition-opacity duration-1000 ease-out
                  ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ 
        width: size, 
        height: size,
        animationDuration: `${speed}s` 
      }}
    >
      <svg 
        viewBox={`${-size/2} ${-size/2} ${size} ${size}`} 
        className="w-full h-full overflow-visible opacity-60"
      >
        <CategoryLabel text="Diplomats" rotation={123.75} radius={radius} color="#d1fae5" />

        <CategoryLabel text="Sentinels" rotation={213.75} radius={radius} color="#e0f2fe" />

        <CategoryLabel text="Explorers" rotation={303.75} radius={radius} color="#fef3c7" />

        <CategoryLabel text="Analysts" rotation={33.75} radius={radius} color="#dbd1fb" />
        
        <circle r={radius} cx="0" cy="0" fill="none" stroke="white" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="4 4" />
      </svg>
    </div>
  );
};

export default PersonalityCategories;