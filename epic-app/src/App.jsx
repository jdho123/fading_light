import { useState, useEffect, useRef } from 'react'
import './App.css'
import Crystal from './components/crystal';
import OrbitingCircle2 from './components/OrbitingCircle2';

// --- SERVICE IMPORTS ---
import { fakeSimulationService } from './services/fakeSimulationService';

// --- ICON IMPORTS ---
import intjIcon from './assets/icons/INTJ.svg';
import intpIcon from './assets/icons/INTP.svg';
import infjIcon from './assets/icons/INFJ.svg';
import infpIcon from './assets/icons/INFP.svg';
import istjIcon from './assets/icons/ISTJ.svg';
import isfjIcon from './assets/icons/ISFJ.svg';
import istpIcon from './assets/icons/ISTP.svg';
import isfpIcon from './assets/icons/ISFP.svg';

// --- CONSTANTS ---
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

//
const VOICE_ID_MAP = {
  INTP: "iiXMKuEphYiFcjqxF9hT",
  INFP: "TAoMcknZ76bE7VZNBnKp",
  ISFP: "nBooZyQ3XaAtDHkVrfra",
  ISTP: "lG0cGOrKcL9V4bXb7K9x",
  INTJ: "8Sgmivd85TTZD6UAMwRh",
  INFJ: "R09tipoJO7WzFgohIVar",
  ISFJ: "HhIoigP8K3a4stK3JhCm",
  ISTJ: "59yNuKbeZrPjixYWRBM9"
};

/**
 * Helper to call the local TTS server and play audio.
 * Returns a Promise that resolves ONLY when audio finishes playing.
 */
const playTTS = async (text, voiceId) => {
  console.log(`🎤 [TTS] Requesting audio for: "${text}"`);
  
  try {
    const res = await fetch("http://127.0.0.1:8000/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice_id: voiceId })
    });

    if (!res.ok) {
      console.error("❌ [TTS] Server Error:", res.status);
      return; 
    }

    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);

    console.log("🔊 [TTS] Audio received, starting playback...");

    return new Promise((resolve) => {
      audio.onended = () => {
        console.log("✅ [TTS] Playback finished.");
        URL.revokeObjectURL(audioUrl);
        resolve(); 
      };
      
      audio.onerror = (e) => {
        console.warn("⚠️ [TTS] Playback error:", e);
        resolve();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn("⚠️ [TTS] Autoplay blocked or failed:", e);
          resolve();
        });
      }
    });

  } catch (err) {
    console.error("❌ [TTS] Network Error (Is server running?):", err);
    return Promise.resolve();
  }
};

function App() {
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [messageQueue, setMessageQueue] = useState([]);
  const [displayedMessage, setDisplayedMessage] = useState(null);
  
  // NEW: Controls the flow of the simulation rounds
  const [isRoundActive, setIsRoundActive] = useState(false);
  
  // NEW: Tracks if the server has finished sending data for the current round
  const [hasServerFinished, setHasServerFinished] = useState(false);

  // NEW: Track the current round number
  const [roundCount, setRoundCount] = useState(1);

  /**
   * INGESTION HANDLER
   */
  const handleDataUpdate = (data) => {
    // Structural update (like READY or status change)
    if (!data.message || data.sender === 'Server') {
      setActiveSimulation(prev => ({ ...prev, ...data }));
    } 
    // Queued message (Personalities talking)
    else if (data.message) {
      setMessageQueue(prev => [...prev, data]);
    }
  };

  /**
   * TRIGGER NEXT ROUND
   * Handles both Fake and Real data sources based on toggle config.
   */
  const handleNextRound = async () => {
    setIsRoundActive(true);
    setHasServerFinished(false); // Reset signal
    
    // Check configuration from the active simulation state
    // Default to TRUE (Fake) if config is missing
    const useFakeData = activeSimulation?.config?.useFakeData ?? true;

    if (useFakeData) {
      console.log(`🎭 [MODE] FAKE Data Selected via Settings. Starting Round ${roundCount}.`);
      
      // Initialize and Start Fake Service
      // Note: In a real app, you might not want to re-initialize every time, 
      // but the fake service handles state reset internally if needed or just continues.
      // We only call initialize if it's the very first round or if we want a hard reset.
      // For now, we'll just call startNextRound() effectively.
      if (roundCount === 1) {
        await fakeSimulationService.initializeSimulation();
      }
      await fakeSimulationService.startNextRound();

      // Start Polling Loop
      const pollLoop = async () => {
        try {
          const msg = await fakeSimulationService.pollMessage();

          if (msg.type === 'turn_over') {
            console.log("🏁 [FAKE] Round Complete (Server Side)");
            setHasServerFinished(true); // Signal that no more messages are coming
            return; 
          }
          
          if (msg.type === 'simulation_ended') {
            console.log("🛑 [FAKE] Simulation Ended");
            setHasServerFinished(true);
            return;
          }

          // Map Fake Service format to App format
          handleDataUpdate({
            type: msg.type === 'SYSTEM' ? 'Server' : msg.type,
            message: msg.content,
            status: msg.sender === 'SYSTEM' ? 'System Alert' : 'Incoming Transmission'
          });

          // Continue polling with a small delay to fill the queue
          setTimeout(pollLoop, 200); 

        } catch (error) {
          console.error("⚠️ [FAKE] Polling error:", error);
        }
      };

      // Kick off the poller
      pollLoop();

    } else {
      console.log(`📡 [MODE] REAL API Selected. Requesting Round ${roundCount}...`);
      // In the future: await fetch('/api/next-round');
    }
  };

  /**
   * QUEUE WATCHER & ROUND END DETECTOR
   */
  useEffect(() => {
    // 1. Detect End of Round:
    // If round is active + server is done + queue is empty + nothing on screen...
    if (isRoundActive && hasServerFinished && messageQueue.length === 0 && !displayedMessage) {
      console.log("🎬 [APP] Round Presentation Finished. Showing Button.");
      setIsRoundActive(false);
      setHasServerFinished(false);
      
      // Increment Round Count for the next button display
      setRoundCount(prev => prev + 1);
      return;
    }

    // 2. Process Next Message:
    // If round is active + nothing on screen + queue has items...
    if (isRoundActive && !displayedMessage && messageQueue.length > 0) {
      const nextData = messageQueue[0];
      setDisplayedMessage(nextData);
      setMessageQueue(prev => prev.slice(1));
    }
  }, [messageQueue, displayedMessage, isRoundActive, hasServerFinished]);

  /**
   * STAGE MANAGER
   */
  useEffect(() => {
    if (displayedMessage) {
      setActiveSimulation(prev => ({
        ...prev,
        type: displayedMessage.type,
        message: displayedMessage.message,
        status: displayedMessage.status || prev?.status
      }));

      let isCancelled = false;

      const runStageSequence = async () => {
        const tasks = [];

        // 1. Minimum Duration (3s)
        tasks.push(new Promise(resolve => setTimeout(resolve, 3000)));

        // 2. TTS (if enabled)
        if (activeSimulation?.config?.textToSpeech) {
          const voiceId = VOICE_ID_MAP[displayedMessage.type];
          if (voiceId) {
            tasks.push(playTTS(displayedMessage.message, voiceId));
          } else {
            console.warn(`No voice ID mapped for type: ${displayedMessage.type}`);
          }
        }

        await Promise.all(tasks);

        // 3. Grace Period
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!isCancelled) {
          setDisplayedMessage(null); 
        }
      };

      runStageSequence();
      return () => { isCancelled = true; };
    }
  }, [displayedMessage]);

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-slate-950 overflow-hidden text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      
      {!activeSimulation ? (
        /* MODE 1: SELECTION */
        <Crystal onSimulationStart={handleDataUpdate} />
      ) : (
        /* MODE 2: DASHBOARD */
        <div className="relative w-full h-full flex animate-in fade-in duration-1000">
          
          {/* LEFT: ORBIT VISUALIZER */}
          <div className="w-1/2 relative min-h-screen flex items-center justify-center border-r border-white/5">
             {PERSONALITY_TYPES.map((type, index) => (
               <OrbitingCircle2 
                 key={type}
                 personality={type} 
                 icon={ICONS[type]} 
                 index={index}
                 totalItems={PERSONALITY_TYPES.length}
                 speed={40} 
                 // Only highlight if round is active AND type matches
                 isHighlighted={isRoundActive && type === activeSimulation.type} 
               />
             ))}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/5 blur-[120px] rounded-full"></div>
          </div>
          
          {/* RIGHT: DATA FEED */}
          <div className="w-1/2 flex flex-col justify-center p-20 z-50">
             <div className="mb-2 text-yellow-500 font-mono tracking-[0.3em] uppercase text-xs font-bold animate-pulse">
               {isRoundActive ? (activeSimulation.status || 'Simulation Active') : 'Standby Mode'}
             </div>

             <h1 className="text-8xl font-bold tracking-tighter mb-8 transition-all duration-700">
                {isRoundActive ? activeSimulation.type : 'Ready'}
             </h1>
             
             {/* CONDITIONAL RENDER: Show Message Box OR Start Button */}
             {isRoundActive ? (
                /* ACTIVE MESSAGE VIEW */
                activeSimulation.message && (
                 <div 
                   key={activeSimulation.message} 
                   className="p-8 bg-white/5 border border-white/10 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-2xl"
                 >
                    <p className="text-cyan-400 font-mono text-[10px] uppercase tracking-widest mb-4 opacity-50">
                      Incoming Transmission:
                    </p>
                    <p className="text-white text-3xl font-light italic leading-relaxed">
                      "{activeSimulation.message}"
                    </p>
                    
                    <div className="mt-8 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                          className="h-full bg-cyan-500/50 animate-progress-fast" 
                          style={{ animationDuration: '3s' }} 
                      />
                    </div>
                 </div>
               )
             ) : (
                /* WAITING / START ROUND BUTTON */
                <div className="p-12 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                    <div className="text-cyan-400 font-mono text-xs uppercase tracking-widest mb-4">
                        Simulation Protocol Loaded
                    </div>
                    <p className="text-white/60 text-lg mb-8 max-w-sm">
                        The agents are initialized and awaiting the round signal. Press below to trigger the scenario.
                    </p>
                    <button 
                        onClick={handleNextRound}
                        className="px-12 py-5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg rounded-full shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:scale-105 transition-all uppercase tracking-wider"
                    >
                        Initialize Round {roundCount}
                    </button>
                </div>
             )}
             
             <button 
               onClick={() => {
                 setActiveSimulation(null);
                 setMessageQueue([]);
                 setDisplayedMessage(null);
                 setIsRoundActive(false); // Reset round state
                 setHasServerFinished(false);
                 setRoundCount(1); // Reset counter
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