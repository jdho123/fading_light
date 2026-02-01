import React, { useState } from 'react';
import LiquidGlass from './LiquidGlass';

/**
 * Helper component for configuration sliders
 */
const ConfigSlider = ({ label, value, min, max, onChange }) => (
  <div className="w-full flex flex-col gap-2 mb-4">
    <div className="flex justify-between items-center px-1">
      <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{label}</span>
      <span className="text-cyan-300 font-mono text-xs">{value}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      value={value} 
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all"
    />
  </div>
);

/**
 * Helper component for boolean toggles
 */
const ConfigToggle = ({ label, value, onChange, activeLabel = "ON", inactiveLabel = "OFF" }) => (
  <div className="w-full flex justify-between items-center mb-6 px-1 bg-white/5 p-3 rounded-lg border border-white/5">
    <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
      {label}
    </span>
    <div className="flex items-center gap-3">
      <span className={`text-[9px] font-bold tracking-wider transition-colors ${!value ? 'text-white/40' : 'text-cyan-400'}`}>
        {value ? activeLabel : inactiveLabel}
      </span>
      <button 
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full relative transition-colors duration-300 focus:outline-none 
                   ${value ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-white/10'}`}
      >
        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 shadow-sm
                        ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  </div>
);

const PersonalityOverlay = ({ type, description, icon, onClose, onSimulationStart }) => {
  // UI States
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Async / Loading States
  const [isStarting, setIsStarting] = useState(false);
  const [startStatus, setStartStatus] = useState("Initialize");

  // Simulation parameters state
  const [config, setConfig] = useState({
    useFakeData: true, // Default to FAKE
    textToSpeech: false,
    globalReplenish: 50,
    globalInit: 600,
    agentMax: 100,
    agentInit: 100,
    agentDecay: 10
  });

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Directly initiates the simulation state, bypassing the old personalityService handshake.
   */
  const handleStart = async () => {
    setIsStarting(true);
    setStartStatus("Initializing...");

    // Simulate a brief system initialization delay for UX effect
    await new Promise(resolve => setTimeout(resolve, 800));

    // Directly trigger the app start. The App.jsx will handle the fakeSimulationService logic.
    onSimulationStart({ 
        type, 
        icon, 
        config, 
        status: 'System Ready' 
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-500">
      
      {/* Invisible Click Listener */}
      <div 
        className="absolute inset-0 bg-transparent" 
        onClick={!isStarting ? onClose : undefined} 
      />

      <LiquidGlass 
        className={`w-full transition-all duration-700 ease-in-out rounded-[3rem] overflow-hidden
                   ${showSettings ? 'max-w-4xl' : (isExpanded ? 'max-w-2xl' : 'max-w-md')}
                   ${isStarting ? 'brightness-110 shadow-[0_0_50px_rgba(34,211,238,0.2)]' : ''}`}
      >
        <div className="relative p-10 flex flex-col items-center">
            
            {/* Settings Cog */}
            {isExpanded && !isStarting && (
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`absolute top-8 right-8 z-50 text-white/40 hover:text-white transition-all duration-500 hover:rotate-90
                           ${showSettings ? 'rotate-180 text-cyan-400' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            )}

            <div className={`flex flex-col md:flex-row w-full gap-12 items-center transition-all duration-700`}>
              
              {/* Identity Section */}
              <div className={`flex flex-col items-center flex-1 transition-all duration-700 ${showSettings ? 'items-start text-left' : 'text-center'}`}>
                {icon && (
                  <div className={`mb-6 relative transition-all duration-700 
                                  ${isExpanded ? 'scale-75 opacity-50' : ''}
                                  ${isStarting ? 'animate-pulse scale-90 opacity-100' : ''}`}>
                    <div className={`absolute -inset-4 bg-cyan-400/20 blur-xl rounded-full transition-opacity duration-700
                                    ${isStarting ? 'opacity-100' : 'opacity-0'}`}></div>
                    <div className="relative w-32 h-32 rounded-full p-[2px] bg-gradient-to-b from-white/40 to-white/5 shadow-2xl">
                      <div className="w-full h-full rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/10">
                        <img src={icon} alt={type} className="w-full h-full object-cover opacity-90" />
                      </div>
                    </div>
                  </div>
                )}

                {!isExpanded ? (
                  <>
                    <div className="mb-6">
                        <h2 className="text-8xl font-bold text-white tracking-tighter drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">{type}</h2>
                        <div className="mt-2 text-xs font-bold tracking-[0.4em] text-cyan-200/90 uppercase drop-shadow-md">Personality Type</div>
                    </div>
                    <p className="text-white text-xl leading-relaxed font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] mb-12">{description}</p>
                    <div className="flex w-full gap-6">
                        <button onClick={onClose} className="flex-1 py-4 rounded-full text-white/80 font-semibold text-sm hover:bg-white/10 hover:text-white transition-all border border-transparent hover:border-white/20">Dismiss</button>
                        <button onClick={() => setIsExpanded(true)} className="flex-[1.5] py-4 rounded-full bg-white/20 text-white font-bold text-sm border border-white/40 backdrop-blur-sm hover:bg-white/30 transition-all">Select</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-12">
                        <h2 className="text-5xl font-bold text-white mb-4">
                          {isStarting ? "Transcendence" : "Journey Awaits"}
                        </h2>
                        <p className="text-cyan-100/70 text-lg">
                          {isStarting ? "Awaiting server acknowledgement..." : `You have chosen the path of the ${type}.`}
                        </p>
                    </div>

                    <div className="flex w-full gap-6">
                        {!isStarting && (
                          <button 
                              onClick={() => { setIsExpanded(false); setShowSettings(false); }} 
                              className="flex-1 py-4 rounded-full text-white/80 font-semibold text-sm hover:bg-white/10 hover:text-white transition-all border border-transparent hover:border-white/20"
                          >
                              Back
                          </button>
                        )}
                        <button 
                            disabled={isStarting}
                            onClick={handleStart}
                            className={`flex-[2] py-4 rounded-full font-bold text-lg border transition-all
                                       ${isStarting 
                                         ? 'bg-white/5 border-white/10 text-cyan-300 cursor-wait' 
                                         : 'bg-cyan-500/40 text-white border-cyan-300/50 hover:bg-cyan-400/50 hover:scale-105 shadow-[0_0_40px_rgba(6,182,212,0.3)]'}`}
                        >
                            <span className="flex items-center justify-center gap-3">
                              {isStarting && <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />}
                              {startStatus}
                            </span>
                        </button>
                    </div>
                  </>
                )}
              </div>

              {/* Settings Panel */}
              {showSettings && (
                <div className={`flex-1 w-full flex flex-col gap-2 p-8 bg-white/5 rounded-[2rem] border border-white/10 animate-in slide-in-from-right-10 duration-700
                                ${isStarting ? 'opacity-40 pointer-events-none' : ''}`}>
                  <h3 className="text-white font-bold text-lg mb-6 tracking-wider flex items-center gap-3">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                    Simulation Parameters
                  </h3>

                  {/* DATA SOURCE TOGGLE (FAKE/REAL) */}
                  <ConfigToggle 
                    label="Data Source" 
                    value={!config.useFakeData} 
                    onChange={(isReal) => handleConfigChange('useFakeData', !isReal)}
                    activeLabel="REAL"
                    inactiveLabel="FAKE"
                  />

                  {/* Text to Speech Toggle */}
                  <ConfigToggle 
                    label="Text to Speech" 
                    value={config.textToSpeech} 
                    onChange={(v) => handleConfigChange('textToSpeech', v)} 
                  />
                  
                  {/* Existing Sliders */}
                  <ConfigSlider label="Global Replenish" value={config.globalReplenish} min={0} max={100} onChange={(v) => handleConfigChange('globalReplenish', v)} />
                  <ConfigSlider label="Global Init" value={config.globalInit} min={200} max={1000} onChange={(v) => handleConfigChange('globalInit', v)} />
                  <ConfigSlider label="Agent Max" value={config.agentMax} min={50} max={100} onChange={(v) => handleConfigChange('agentMax', v)} />
                  <ConfigSlider label="Agent Init" value={config.agentInit} min={50} max={100} onChange={(v) => handleConfigChange('agentInit', v)} />
                  <ConfigSlider label="Agent Decay" value={config.agentDecay} min={1} max={25} onChange={(v) => handleConfigChange('agentDecay', v)} />
                </div>
              )}
            </div>
        </div>
      </LiquidGlass>
    </div>
  );
};

export default PersonalityOverlay;