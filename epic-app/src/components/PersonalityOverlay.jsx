import React from 'react';
import LiquidGlass from './LiquidGlass';

const PersonalityOverlay = ({ type, description, icon, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-500">
      
      {/* Invisible Click Listener */}
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />

      <LiquidGlass className="w-full max-w-md rounded-[3rem] transition-all duration-500">
        <div className="relative p-10 flex flex-col items-center text-center">
            
            {/* --- NEW: Icon Section --- */}
            {/* This creates a glowing glass pedestal for the icon */}
            {icon && (
              <div className="mb-6 relative group">
                <div className="absolute -inset-4 bg-white/20 blur-xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity duration-700"></div>
                <div className="relative w-32 h-32 rounded-full p-[2px] bg-gradient-to-b from-white/40 to-white/5 shadow-2xl">
                  <div className="w-full h-full rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/10">
                    <img 
                      src={icon} 
                      alt={type} 
                      className="w-full h-full object-cover opacity-90 hover:scale-110 transition-transform duration-700" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Title Section */}
            <div className="mb-6">
                <h2 className="text-8xl font-bold text-white tracking-tighter drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    {type}
                </h2>
                <div className="mt-2 text-xs font-bold tracking-[0.4em] text-cyan-200/90 uppercase drop-shadow-md">
                    Personality Type
                </div>
            </div>
            
            {/* Description */}
            <p className="text-white text-xl leading-relaxed font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] mb-12">
                {description}
            </p>

            {/* Buttons */}
            <div className="flex w-full gap-6">
                <button 
                    onClick={onClose}
                    className="flex-1 py-4 rounded-full text-white/80 font-semibold text-sm 
                               hover:bg-white/10 hover:text-white transition-all 
                               shadow-[0_0_10px_rgba(0,0,0,0.2)] border border-transparent hover:border-white/20"
                >
                    Dismiss
                </button>
                <button 
                    className="flex-[1.5] py-4 rounded-full bg-white/20 text-white font-bold text-sm
                               border border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.1)]
                               backdrop-blur-sm hover:bg-white/30 hover:scale-105 transition-all"
                >
                    Select
                </button>
            </div>
        </div>
      </LiquidGlass>
    </div>
  );
};

export default PersonalityOverlay;