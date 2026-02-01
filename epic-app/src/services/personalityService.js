/**
 * Simulated Socket/API Service
 * Emits a READY signal, then follows with personality data packets.
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const personalityService = {
  startSimulation: async (onMessage) => {
    // 1. Initial Server Acknowledgement
    onMessage({ sender: 'Server', message: 'READY' });
    
    // Small delay to simulate processing before the first data packet
    await sleep(500);

    // 2. First personality update
    onMessage({ 
      type: 'ENTJ', 
      message: 'hello',
      status: 'Inbound Transmission'
    });
    
    // 3. Forced 2-second wait
    await sleep(2000);
    
    // 4. Second personality update
    onMessage({ 
      type: 'INTJ', 
      message: 'Hi there',
      status: 'Protocol Updated'
    });

    await sleep(4000);

    onMessage({ 
      type: 'ISTP', 
      message: 'I am loving the IC hackathon!',
      status: 'Protocol Updated'
    });
  }
};