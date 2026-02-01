import { useState, useEffect, useRef } from 'react'
import './App.css'
import Crystal from './components/crystal';
import OrbitingCircle2 from './components/OrbitingCircle2';

// --- CONSTANTS ---
const API_BASE = "http://127.0.0.1:8000";

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
  const [messageHistory, setMessageHistory] = useState([]);
  
  // NEW: Controls the flow of the simulation rounds
  const [isRoundActive, setIsRoundActive] = useState(false);
  
  // NEW: Tracks if the server has finished sending data for the current round
  const [hasServerFinished, setHasServerFinished] = useState(false);

  // NEW: Track the current round number
  const [roundCount, setRoundCount] = useState(1);

  const scrollRef = useRef(null);

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
   * TRIGGER NEXT ROUND (Live API)
   */
  const handleNextRound = async () => {
    setIsRoundActive(true);
    setHasServerFinished(false); 

    try {
      // 1. Kick off the round on the server
      const triggerRes = await fetch(`${API_BASE}/generate-turn`);
      const triggerData = await triggerRes.json();
      
      if (triggerData.status === 'started' || triggerData.status === 'already_processing') {
        console.log("🚀 [API] Simulation round triggered.");
        
        // 2. Start Polling for messages
        const pollLoop = async () => {
          try {
            const pollRes = await fetch(`${API_BASE}/get-message`);
            const msg = await pollRes.json();

            // Handle Server Signals
            if (msg.type === 'turn_over') {
              console.log("🏁 [API] Round Complete.");
              setHasServerFinished(true); 
              return; 
            }
            
            if (msg.type === 'simulation_ended') {
              console.log("🛑 [API] Simulation Ended.");
              setHasServerFinished(true);
              return;
            }

            // Handle Content
            if (msg.type === 'text' || msg.type === 'system' || msg.type === 'round_start') {
              // Extract MBTI type from sender string like "Architect (INTJ)"
              const mbtiMatch = msg.sender.match(/\((.*?)\)/);
              const mbtiType = mbtiMatch ? mbtiMatch[1] : msg.type;

              handleDataUpdate({
                type: msg.sender === 'SYSTEM' ? 'Server' : mbtiType,
                message: msg.content,
                status: msg.sender === 'SYSTEM' ? 'System Alert' : 'Incoming Transmission'
              });
            }

            // If "none", wait longer before polling again. If "text", poll immediately for next.
            const delay = msg.type === 'none' ? 1000 : 200;
            setTimeout(pollLoop, delay);

          } catch (error) {
            console.error("⚠️ [API] Polling error:", error);
            // Retry after delay
            setTimeout(pollLoop, 2000);
          }
        };

        pollLoop();
      } else {
        console.error("❌ [API] Failed to start round:", triggerData);
        setIsRoundActive(false);
      }

    } catch (err) {
      console.error("❌ [API] Network Error (Is backend running?):", err);
      setIsRoundActive(false);
    }
  };

  /**
   * QUEUE WATCHER & ROUND END DETECTOR
   */
  useEffect(() => {
    if (isRoundActive && hasServerFinished && messageQueue.length === 0 && !displayedMessage) {
      setIsRoundActive(false);
      setHasServerFinished(false);
      setRoundCount(prev => prev + 1);
      return;
    }

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

      setMessageHistory(prev => [...prev, displayedMessage]);

      let isCancelled = false;

      const runStageSequence = async () => {
        const tasks = [];
        tasks.push(new Promise(resolve => setTimeout(resolve, 3000)));

        if (activeSimulation?.config?.textToSpeech) {
          const voiceId = VOICE_ID_MAP[displayedMessage.type];
          if (voiceId) {
            tasks.push(playTTS(displayedMessage.message, voiceId));
          }
        }

        await Promise.all(tasks);
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!isCancelled) {
          setDisplayedMessage(null); 
        }
      };

      runStageSequence();
      return () => { isCancelled = true; };
    }
  }, [displayedMessage]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messageHistory]);

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-slate-950 overflow-hidden text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      
      {!activeSimulation ? (
        <Crystal onSimulationStart={handleDataUpdate} />
      ) : (
        <div className="relative w-full h-full flex animate-in fade-in duration-1000">
          
          {/* LEFT: CRYSTAL VISUALIZER (60% width for better spacing) */}
          <div className="w-[60%] relative min-h-screen flex items-center justify-center border-r border-white/5">
             <div className="relative scale-90 transition-all duration-1000">
                {PERSONALITY_TYPES.map((type, index) => (
                  <OrbitingCircle2 
                    key={type}
                    personality={type} 
                    icon={ICONS[type]} 
                    index={index}
                    totalItems={PERSONALITY_TYPES.length}
                    speed={64} 
                    isHighlighted={isRoundActive && type === activeSimulation.type} 
                  />
                ))}
                
                {/* Crystal Graphic Core */}
                <div className="relative w-24 h-40 animate-float opacity-80">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-300 via-cyan-500 to-blue-900 -translate-x-4 -rotate-6" style={{ clipPath: "polygon(0% 50%, 50% 0%, 50% 100%)" }}></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-300 via-cyan-500 to-blue-900 translate-x-4 rotate-6" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%)" }}></div>
                    <div className="absolute inset-0 bg-cyan-400 blur-3xl opacity-20"></div>
                </div>
             </div>
          </div>
          
          {/* RIGHT: CHAT WINDOW (40% width) */}
          <div className="w-[40%] flex flex-col h-screen z-50 p-10 animate-in slide-in-from-right-10 duration-1000">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="text-yellow-500 font-mono tracking-[0.3em] uppercase text-xs font-bold animate-pulse">
                      {isRoundActive ? (activeSimulation.status || 'Simulation Active') : 'Standby Mode'}
                    </div>
                    <h1 className="text-4xl font-bold tracking-tighter">Transmission Log</h1>
                </div>
                
                {!isRoundActive && (
                    <button 
                        onClick={handleNextRound}
                        className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all uppercase tracking-wider"
                    >
                        Start Round {roundCount}
                    </button>
                )}
             </div>

             <div 
               ref={scrollRef}
               className="flex-1 overflow-y-auto pr-4 space-y-4 scrollbar-hide"
               style={{ scrollBehavior: 'smooth' }}
             >
                {messageHistory.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                        <div className="w-12 h-12 border-2 border-dashed border-white/20 rounded-full mb-4 animate-spin-slow"></div>
                        <p className="font-mono text-xs uppercase tracking-widest">Awaiting Data Streams...</p>
                    </div>
                )}
                
                {messageHistory.map((msg, i) => (
                    <div 
                      key={i}
                      className={`p-5 rounded-2xl border transition-all duration-500 animate-in slide-in-from-right-4
                                 ${msg === displayedMessage ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'bg-white/5 border-white/10 opacity-60'}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-cyan-400 font-mono text-[10px] uppercase tracking-widest font-bold">
                                {msg.type}
                            </span>
                            <span className="text-white/20 font-mono text-[8px]">
                                {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        </div>
                        <p className={`text-lg leading-relaxed ${msg === displayedMessage ? 'text-white' : 'text-white/70'}`}>
                            "{msg.message}"
                        </p>
                    </div>
                ))}
             </div>
             
             <div className="mt-6 flex gap-4">
                <button 
                  onClick={async () => {
                    await fetch(`${API_BASE}/reset`, { method: 'POST' }).catch(() => {});
                    setActiveSimulation(null);
                    setMessageQueue([]);
                    setDisplayedMessage(null);
                    setMessageHistory([]);
                    setIsRoundActive(false); 
                    setHasServerFinished(false);
                    setRoundCount(1); 
                  }}
                  className="px-6 py-3 rounded-full border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all uppercase tracking-widest text-[10px] font-bold"
                >
                  Reset Protocol
                </button>
             </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;