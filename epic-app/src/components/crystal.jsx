import React, { useState, useRef } from 'react';
import OrbitingCircle from './OrbitingCircle';
import PersonalityOverlay from './PersonalityOverlay';
import PersonalityCategories from './PersonalityCategories';

import intjIcon from '../assets/icons/INTJ.svg';
import intpIcon from '../assets/icons/INTP.svg';
import infjIcon from '../assets/icons/INFJ.svg';
import infpIcon from '../assets/icons/INFP.svg';
import istjIcon from '../assets/icons/ISTJ.svg';
import isfjIcon from '../assets/icons/ISFJ.svg';
import istpIcon from '../assets/icons/ISTP.svg';
import isfpIcon from '../assets/icons/ISFP.svg';

const PERSONALITY_TYPES = [
  'INTJ', 'INTP', 'INFJ', 'INFP',
  'ISTJ', 'ISFJ', 'ISTP', 'ISFP'
];

const ICONS = {
  INTJ: intjIcon, INTP: intpIcon,
  INFJ: infjIcon, INFP: infpIcon,
  ISTJ: istjIcon, ISFJ: isfjIcon,
  ISTP: istpIcon, ISFP: isfpIcon,
};

const PERSONALITY_DESCRIPTIONS = {
  INTJ: "Imaginative and strategic thinkers, with a plan for everything.",
  INTP: "Innovative inventors with an unquenchable thirst for knowledge.",
  INFJ: "Quiet and mystical, yet very inspiring and tireless idealists.",
  INFP: "Poetic, kind and altruistic people, always eager to help a good cause.",
  ISTJ: "Practical and fact-minded individuals, whose reliability cannot be doubted.",
  ISFJ: "Very dedicated and warm protectors, always ready to defend their loved ones.",
  ISTP: "Bold and practical experimenters, masters of all kinds of tools.",
  ISFP: "Flexible and charming artists, always ready to explore and experience something new.",
};

const Crystal = ({ onSimulationStart }) => {
  const [shockwaves, setShockwaves] = useState([]);
  const [isCracked, setIsCracked] = useState(false);
  
  const [hoveredOrbId, setHoveredOrbId] = useState(null);
  const [selectedPersonality, setSelectedPersonality] = useState(null); 
  const [confirmedPersonality, setConfirmedPersonality] = useState(null);
  const [isInteractionLocked, setIsInteractionLocked] = useState(false);
  
  const leaveTimeoutRef = useRef(null);
  const lastShockwaveTimeRef = useRef(0);

  const triggerShockwave = () => {
    const now = Date.now();
    if (now - lastShockwaveTimeRef.current < 500) return;
    lastShockwaveTimeRef.current = now;
    
    const id = now;
    setShockwaves((prev) => [...prev, id]);
    setTimeout(() => {
      setShockwaves((prev) => prev.filter((waveId) => waveId !== id));
    }, 1000);
  };

  const handleCrackToggle = () => {
    if (!isCracked) {
      setIsInteractionLocked(true);
      setTimeout(() => setIsInteractionLocked(false), 300);
    }
    setIsCracked(!isCracked);
  };

  const handleOrbHover = (id) => {
    if (isInteractionLocked || selectedPersonality) return;
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setHoveredOrbId(id);
  };

  const handleOrbLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredOrbId(null);
    }, 300);
  };

  const handleOrbClick = (id) => {
    if (isInteractionLocked) return;
    setSelectedPersonality(id);
    setHoveredOrbId(null);
  };

  return (
    <>
      {selectedPersonality && (
        <PersonalityOverlay 
          type={selectedPersonality}
          description={PERSONALITY_DESCRIPTIONS[selectedPersonality]}
          icon={ICONS[selectedPersonality]}
          onClose={() => setSelectedPersonality(null)}
          onSelect={(type) => setConfirmedPersonality(type)}
          onSimulationStart={onSimulationStart}
        />
      )}

      <div className={`relative flex items-center justify-center transition-all duration-1000 ease-in-out
                       ${isCracked ? '-translate-x-64' : 'translate-x-0'}
                       ${selectedPersonality ? 'pointer-events-none blur-sm brightness-50 scale-95' : 'opacity-100'}`}>
        
        {/* --- MODIFIED: Rotating Category Text --- */}
        {/* Now accepts isVisible={isCracked} to sync with animation */}
        <PersonalityCategories radius={280} speed={64} isVisible={isCracked} />

        {PERSONALITY_TYPES.map((type, index) => (
          <OrbitingCircle 
            key={type} 
            personality={type}
            icon={ICONS[type]} 
            isCracked={isCracked} 
            radius={240} 
            speed={64} 
            delay={index * 8}
            onOrbHover={() => handleOrbHover(type)}
            onOrbLeave={handleOrbLeave}
            onOrbClick={() => handleOrbClick(type)}
            isHovered={hoveredOrbId === type}
            isDimmed={hoveredOrbId !== null && hoveredOrbId !== type}
          />
        ))}

        {shockwaves.map((id) => (
          <div
            key={id}
            className="absolute top-1/2 left-1/2
                       w-24 h-24 border-white rounded-full 
                       animate-shockwave pointer-events-none z-0"
          />
        ))}

        <div className="group relative cursor-pointer select-none">
          <div 
              onMouseEnter={triggerShockwave}
              onClick={handleCrackToggle}
              className="relative"
          >
              <div className={`absolute inset-0 bg-red-600 blur-3xl opacity-40 animate-pulse transition-all duration-700 
                              group-hover:bg-cyan-500 group-hover:opacity-60 ${isCracked ? 'opacity-20 scale-150' : ''}`}></div>
              <div className="absolute inset-0 bg-red-500 blur-2xl opacity-30 animate-ping transition-all duration-1000 group-hover:opacity-0"></div>
              <div className="relative w-24 h-40 animate-float transition-transform duration-500">
                  <div 
                      className={`absolute inset-0 bg-gradient-to-b from-red-400 via-red-600 to-red-900 
                              transition-all duration-500 ease-out
                              group-hover:from-cyan-300 group-hover:via-cyan-500 group-hover:to-blue-900
                              ${isCracked ? '-translate-x-4 -rotate-6 opacity-80' : ''}`}
                      style={{ clipPath: "polygon(0% 50%, 50% 0%, 50% 100%)" }}
                  >
                      <div className="absolute inset-0 bg-white/20 w-full h-full skew-x-12 transform-gpu"></div>
                  </div>
                  <div 
                      className={`absolute inset-0 bg-gradient-to-b from-red-400 via-red-600 to-red-900 
                              transition-all duration-500 ease-out
                              group-hover:from-cyan-300 group-hover:via-cyan-500 group-hover:to-blue-900
                              ${isCracked ? 'translate-x-4 rotate-6 opacity-80' : ''}`}
                      style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%)" }}
                  >
                      <div className="absolute inset-0 bg-white/10 w-full h-full -skew-x-12 transform-gpu"></div>
                  </div>
              </div>
          </div>
          <div className={`absolute -bottom-16 left-1/2 -translate-x-1/2 h-4 bg-red-600/20 blur-xl rounded-full transition-all duration-700 
                          group-hover:bg-cyan-500/40 ${isCracked ? 'w-32 opacity-10' : 'w-16'}`}></div>
        </div>
      </div>
    </>
  );
};

export default Crystal;