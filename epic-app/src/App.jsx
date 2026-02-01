import { useState, useEffect } from 'react'
import './App.css'
import Crystal from './components/crystal';
import OrbitingCircle2 from './components/OrbitingCircle2';

// --- ICON IMPORTS ---
import intjIcon from './assets/icons/INTJ.svg';
import intpIcon from './assets/icons/INTP.svg';
import entjIcon from './assets/icons/ENTJ.svg';
import entpIcon from './assets/icons/ENTP.svg';
import infjIcon from './assets/icons/INFJ.svg';
import infpIcon from './assets/icons/INFP.svg';
import enfjIcon from './assets/icons/ENFJ.svg';
import enfpIcon from './assets/icons/ENFP.svg';
import istjIcon from './assets/icons/ISTJ.svg';
import isfjIcon from './assets/icons/ISFJ.svg';
import estjIcon from './assets/icons/ESTJ.svg';
import esfjIcon from './assets/icons/ESFJ.svg';
import istpIcon from './assets/icons/ISTP.svg';
import isfpIcon from './assets/icons/ISFP.svg';
import estpIcon from './assets/icons/ESTP.svg';
import esfpIcon from './assets/icons/ESFP.svg';

// --- CONSTANTS ---
const PERSONALITY_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

const ICONS = {
  INTJ: intjIcon, INTP: intpIcon, ENTJ: entjIcon, ENTP: entpIcon,
  INFJ: infjIcon, INFP: infpIcon, ENFJ: enfjIcon, ENFP: enfpIcon,
  ISTJ: istjIcon, ISFJ: isfjIcon, ESTJ: estjIcon, ESFJ: esfjIcon,
  ISTP: istpIcon, ISFP: isfpIcon, ESTP: estpIcon, ESFP: esfpIcon,
  ISTP: istpIcon, ISFP: isfpIcon, ESTP: estpIcon, ESFP: esfpIcon,
};

function App() {
  // --- STATE MANAGEMENT ---
  const [activeSimulation, setActiveSimulation] = useState(null);
  
  // The Waiting Line: Stores messages that haven't been shown yet
  const [messageQueue, setMessageQueue] = useState([]);
  
  // The Stage: Stores the message currently being shown (or null if empty)
  const [displayedMessage, setDisplayedMessage] = useState(null);

  /**
   * INGESTION HANDLER
   */
  const handleDataUpdate = (data) => {
    // If it's a message from a personality, add it to the waiting line.
    if (data.message && data.sender !== 'Server') {
      setMessageQueue(prev => [...prev, data]);
    } else {
      // Immediate update for system signals (e.g. READY, Status changes)
      setActiveSimulation(prev => ({ ...prev, ...data }));
    }
  };

  /**
   * EFFECT 1: QUEUE WATCHER
   * If the stage is empty and there are people in line, move the first one to the stage.
   */
  useEffect(() => {
    if (!displayedMessage && messageQueue.length > 0) {
      const nextData = messageQueue[0];
      setDisplayedMessage(nextData);              // Move to stage
      setMessageQueue(prev => prev.slice(1));     // Remove from line
    }
  }, [messageQueue, displayedMessage]);

  /**
   * EFFECT 2: STAGE MANAGER
   * When someone steps on stage, update the UI, wait 3 seconds, then clear the stage.
   */
  useEffect(() => {
    if (displayedMessage) {
      // 1. Update the Main Dashboard with the new actor
      setActiveSimulation(prev => ({
        ...prev,
        type: displayedMessage.type,
        message: displayedMessage.message,
        status: displayedMessage.status || prev?.status
      }));

      // 2. Start the 3-second spotlight timer
      const timer = setTimeout(() => {
        setDisplayedMessage(null); // Clear stage (triggers Effect 1)
      }, 3000);

      // Cleanup: Only runs if component unmounts or displayedMessage changes
      // (which doesn't happen until the timer finishes).
      return () => clearTimeout(timer);
    }
  }, [displayedMessage]);

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-slate-950 overflow-hidden text-white">
      {/* BACKGROUND GRID */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      
      {!activeSimulation ? (
        /* --- MODE 1: SELECTION (Interactive Crystal) --- */
        <Crystal onSimulationStart={handleDataUpdate} />
      ) : (
        /* --- MODE 2: DASHBOARD (Simulation View) --- */
        <div className="relative w-full h-full flex animate-in fade-in duration-1000">
          
          {/* LEFT COLUMN: ORBITING VISUALIZER */}
          <div className="w-1/2 relative min-h-screen flex items-center justify-center border-r border-white/5">
             {PERSONALITY_TYPES.map((type, index) => (
               <OrbitingCircle2 
                 key={type}
                 personality={type} 
                 icon={ICONS[type]} 
                 index={index}
                 totalItems={PERSONALITY_TYPES.length}
                 speed={40} 
                 isHighlighted={type === activeSimulation.type} // Dynamic Gold Highlight
               />
             ))}
             
             {/* Central Atmospheric Glow */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/5 blur-[120px] rounded-full"></div>
          </div>
          
          {/* RIGHT COLUMN: DATA FEED & CONTROLS */}
          <div className="w-1/2 flex flex-col justify-center p-20 z-50">
             {/* Status Indicator */}
             <div className="mb-2 text-yellow-500 font-mono tracking-[0.3em] uppercase text-xs font-bold animate-pulse">
               {activeSimulation.status || 'Simulation Active'}
             </div>

             {/* Active Personality Title */}
             <h1 className="text-8xl font-bold tracking-tighter mb-8 transition-all duration-700">
                {activeSimulation.type}
             </h1>
             
             {/* Message Box with Progress Bar */}
             {activeSimulation.message && (
               <div 
                 key={activeSimulation.message} // Forces re-render for animation reset
                 className="p-8 bg-white/5 border border-white/10 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-2xl"
               >
                  <p className="text-cyan-400 font-mono text-[10px] uppercase tracking-widest mb-4 opacity-50">
                    Incoming Transmission:
                  </p>
                  <p className="text-white text-3xl font-light italic leading-relaxed">
                    "{activeSimulation.message}"
                  </p>
                  
                  {/* The 3-second Progress Bar */}
                  <div className="mt-8 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-cyan-500/50 animate-progress-fast" 
                        style={{ animationDuration: '3s' }} 
                    />
                  </div>
               </div>
             )}
             
             {/* Reset / Terminate Button */}
             <button 
               onClick={() => {
                 setActiveSimulation(null);
                 setMessageQueue([]);
                 setDisplayedMessage(null);
               }}
               className="mt-12 px-10 py-4 rounded-full border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all w-fit uppercase tracking-widest text-[10px] font-bold"
             >
               Terminate Protocol
             </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;