import { useState, useEffect, useRef } from 'react'
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
};

//
const VOICE_ID_MAP = {
  ENTJ: "upefjlNvhzs6Bcw8VH6r",
  ENFJ: "E7Sex9zr9pSdBwMmCFf8",
  ESFJ: "detYsvmHyJYEoGhsaCV2",
  ESTJ: "C6wx0jKQZOfbhGCMLxln",
  ENTP: "rvh70NPK87mkgsNu0qCU",
  ENFP: "3zbDWL5dkaYKTYEwWAxL",
  ESFP: "N81i2PTFujmPrv7rr7eq",
  ESTP: "mbsOxFgNBAnyYulmKarO",
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
    // 1. Fetch audio from local Python/Node server
    const res = await fetch("http://127.0.0.1:8000/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice_id: voiceId })
    });

    if (!res.ok) {
      console.error("❌ [TTS] Server Error:", res.status);
      return; // Resolve immediately to unblock queue
    }

    // 2. Load Audio Blob
    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);

    console.log("🔊 [TTS] Audio received, starting playback...");

    // 3. Play and wait for 'ended' event
    return new Promise((resolve) => {
      audio.onended = () => {
        console.log("✅ [TTS] Playback finished.");
        URL.revokeObjectURL(audioUrl);
        resolve(); // Only resolve when audio is actually done
      };
      
      audio.onerror = (e) => {
        console.warn("⚠️ [TTS] Playback error:", e);
        resolve(); // Unblock queue if audio breaks
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn("⚠️ [TTS] Autoplay blocked or failed:", e);
          resolve(); // Unblock queue if browser blocks sound
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
   * QUEUE WATCHER: Moves next item to stage if stage is empty
   */
  useEffect(() => {
    if (!displayedMessage && messageQueue.length > 0) {
      const nextData = messageQueue[0];
      setDisplayedMessage(nextData);
      setMessageQueue(prev => prev.slice(1));
    }
  }, [messageQueue, displayedMessage]);

  /**
   * STAGE MANAGER: Handles Visual Timer + TTS Synchronization
   */
  useEffect(() => {
    if (displayedMessage) {
      // Update the Dashboard UI
      setActiveSimulation(prev => ({
        ...prev,
        type: displayedMessage.type,
        message: displayedMessage.message,
        status: displayedMessage.status || prev?.status
      }));

      let isCancelled = false;

      const runStageSequence = async () => {
        const tasks = [];

        // 1. Minimum Visual Duration (3 seconds)
        // Even if audio is super short, we wait at least 3s.
        tasks.push(new Promise(resolve => setTimeout(resolve, 3000)));

        // 2. TTS Playback (if enabled)
        // If audio is 5s long, this promise will take 5s, extending the wait.
        if (activeSimulation?.config?.textToSpeech) {
          const voiceId = VOICE_ID_MAP[displayedMessage.type];
          if (voiceId) {
            tasks.push(playTTS(displayedMessage.message, voiceId));
          } else {
            console.warn(`No voice ID mapped for type: ${displayedMessage.type}`);
          }
        }

        // Wait for BOTH (whichever is longer)
        await Promise.all(tasks);

        // 3. Grace Period (1 second)
        // Give the user a moment of silence after the voice ends before switching.
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!isCancelled) {
          setDisplayedMessage(null); // Clears stage -> Trigger Queue Watcher for next msg
        }
      };

      runStageSequence();

      return () => { isCancelled = true; };
    }
  }, [displayedMessage]);

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-slate-950 overflow-hidden text-white">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      
      {!activeSimulation ? (
        /* MODE 1: CRYSTAL SELECTION */
        <Crystal onSimulationStart={handleDataUpdate} />
      ) : (
        /* MODE 2: DASHBOARD SIMULATION */
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
                 isHighlighted={type === activeSimulation.type} 
               />
             ))}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/5 blur-[120px] rounded-full"></div>
          </div>
          
          {/* RIGHT: DATA FEED */}
          <div className="w-1/2 flex flex-col justify-center p-20 z-50">
             <div className="mb-2 text-yellow-500 font-mono tracking-[0.3em] uppercase text-xs font-bold animate-pulse">
               {activeSimulation.status || 'Simulation Active'}
             </div>

             <h1 className="text-8xl font-bold tracking-tighter mb-8 transition-all duration-700">
                {activeSimulation.type}
             </h1>
             
             {activeSimulation.message && (
               <div 
                 key={activeSimulation.message} // Key forces re-animation on new message
                 className="p-8 bg-white/5 border border-white/10 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-2xl"
               >
                  <p className="text-cyan-400 font-mono text-[10px] uppercase tracking-widest mb-4 opacity-50">
                    Incoming Transmission:
                  </p>
                  <p className="text-white text-3xl font-light italic leading-relaxed">
                    "{activeSimulation.message}"
                  </p>
                  
                  {/* Progress Bar (Visual only, fixed to 3s for style) */}
                  <div className="mt-8 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-cyan-500/50 animate-progress-fast" 
                        style={{ animationDuration: '3s' }} 
                    />
                  </div>
               </div>
             )}
             
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