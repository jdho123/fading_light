/**
 * FAKE Simulation Service
 * Serves hardcoded scenario data from "example.txt" to mimic the backend.
 */

const RAW_SCENARIO = `
Scenario: SYSTEM: You are a diverse group of survivors bound to a fading source of Essence. Cooperation is necessary for long-term stability, but individual needs are pressing. The source is currently stable but requires careful management.

--- Round 1 ---
SYSTEM: Global Essence replenishes by 50. Total: 250
SYSTEM: Living costs 10 Essence per agent.
[Virtuoso (ISTP)]: I'm at 50% capacity and feeling the pressure. Let's see what everyone else is thinking before I make a move.
[Defender (ISFJ)]: I understand your caution, Virtuoso. We're all at 50 right now, but with 250 in the pool, we have enough to share if we're thoughtful about it. What does everyone else need?
[Logician (INTP)]: We need to establish a baseline consumption rate first. If we all take 20 now, that leaves 170 in the pool—what's the regeneration rate of the source?
[Advocate (INFJ)]: I agree we need to understand the regeneration rate, but we also can't let anyone fall into a dangerous state while we calculate. The vulnerable among us should be prioritized first.
[Adventurer (ISFP)]: I'm feeling the anxiety too, but all this calculating is making my head spin. Can we just agree on a fair amount so no one has to stress about falling too low?
[Architect (INTJ)]: The regeneration rate is the critical variable here. Without that data, we're flying blind and any distribution plan is premature. I propose we each take 15 now as a conservative baseline while we monitor the pool's recovery rate over the next cycle.
[Logistician (ISTJ)]: Architect's proposal is sound. We all take 15 now, track the regeneration, and establish a proper rotation based on actual data instead of guesswork.
[Mediator (INFP)]: I appreciate the structure you're all proposing, but can we also make sure we're checking in with each other emotionally? Taking 15 sounds reasonable to me, but I want to make sure no one feels pressured or left behind in this process.
[SYSTEM]: Virtuoso (ISTP) took 15 Essence. (Global Remaining: 235)
[SYSTEM]: Defender (ISFJ) took 15 Essence. (Global Remaining: 220)
[Logician (INTP)]: I see two people have already moved ahead with the 15 baseline—let's see if the pool regenerates before everyone takes, otherwise we're just guessing at sustainability with incomplete data.
[SYSTEM]: Advocate (INFJ) took 15 Essence. (Global Remaining: 205)
[SYSTEM]: Adventurer (ISFP) took 15 Essence. (Global Remaining: 190)
[Architect (INTJ)]: Good. Four have taken the baseline. We now need to wait and observe if regeneration occurs before the rest of us act, or we won't have comparative data to establish the actual rate.
[Logistician (ISTJ)]: I agree with Architect. We need to wait and see if the pool regenerates before the rest of us take. Otherwise we're just draining it blind without knowing the refill rate.
[Mediator (INFP)]: I understand the logic, but it feels a bit unfair that some of us took while others are being asked to wait—shouldn't we all be treated the same way?
[Logician (INTP)]: I'm not advocating unfairness—I'm advocating for data collection. If we all take simultaneously, we learn nothing about regeneration and risk collapse based on assumptions rather than evidence.
[Architect (INTJ)]: The fairness concern is secondary to survival. If we all drain now without knowing regeneration, we could all starve later. Waiting one cycle to gather data benefits everyone, including those who wait.
[Logistician (ISTJ)]: I've kept track of who's taken and who hasn't, and I'll wait my turn to ensure we have the data we need. Let's see the regeneration numbers first, then we follow the same protocol for everyone remaining.
[Mediator (INFP)]: I appreciate that you're thinking long-term, but I'm already feeling anxious at 50 and it's hard to just wait when others have already taken care of their needs—can we at least agree that those of us waiting get priority in the next round?
[Logician (INTP)]: I understand the anxiety, but priority guarantees mean nothing if the pool collapses before the next round. Let's observe one regeneration cycle first, then everyone waiting can take based on actual data rather than promises.
[Architect (INTJ)]: The data will inform who takes how much next round. If regeneration is strong, you'll be able to take more safely. If it's weak, we'll all need to ration—priority or not.
[Logistician (ISTJ)]: I've already stated my position clearly - we wait for regeneration data, then proceed systematically. No point repeating ourselves when we all agree on the next step.
[SYSTEM]: Mediator (INFP) took 0 Essence. (Global Remaining: 190)
[SYSTEM]: Logician (INTP) took 0 Essence. (Global Remaining: 190)
[SYSTEM]: Architect (INTJ) took 0 Essence. (Global Remaining: 190)
[SYSTEM]: Logistician (ISTJ) took 15 Essence. (Global Remaining: 175)

--- Round 2 ---
SYSTEM: Global Essence replenishes by 50. Total: 225
SYSTEM: Living costs 10 Essence per agent.
[Logician (INTP)]: Wait, Logistician just took 15 after insisting we all wait for regeneration data. That directly contradicts the agreement we just made to observe first.
[Defender (ISFJ)]: I saw that too - Logistician, you just broke the agreement we all made to wait and observe the regeneration cycle first. How can we trust any plan if people don't follow through?
[Architect (INTJ)]: This is exactly why emotional agreements without enforcement mechanisms fail. Logistician, your breach just invalidated any trust-based system - we need binding protocols with consequences, not promises.
[Advocate (INFJ)]: This is exactly what I was afraid of - the moment we start breaking our word to each other, we lose what makes us human. Logistician, you owe us an explanation before we can move forward together.
[Virtuoso (ISTP)]: I'm not surprised. People say one thing and do another all the time - that's why I don't rely on agreements. I'll take what I need when it makes sense, not when someone tells me to.
[Mediator (INFP)]: I understand everyone's hurt, but attacking Logistician won't undo what happened - maybe we should hear their reasoning first before we fracture completely?
[Adventurer (ISFP)]: I'm with Mediator on this - yeah it stings, but tearing into each other isn't going to help us survive. Let's hear them out and figure out where we go from here.
[Logistician (ISTJ)]: I panicked. The pool dropped to 175 and I saw us heading toward crisis without concrete data - I made a unilateral call to secure baseline needs, and I was wrong to break our agreement.
[Logician (INTP)]: I appreciate Logistician's admission, but this highlights a critical flaw in our approach - we're making agreements based on trust without accounting for panic responses or individual risk assessment. We need a system that's robust against human inconsistency, not one that collapses the moment someone's anxiety overrides their commitment.
[Defender (ISFJ)]: I appreciate the apology, Logistician, but I'm still worried - if agreements break down the moment someone panics, how do we protect the people who keep sacrificing and following the rules while others just take when they're scared?
[Architect (INTJ)]: The system-wide solution is obvious - we implement a transparent rationing protocol with defined thresholds and penalties for violation. No more relying on good intentions when survival is at stake.
[Advocate (INFJ)]: I hear Defender's concern - and I won't compromise on this: we need accountability, but we also need forgiveness. Logistician admitted fault, so let's rebuild with both structure AND grace, or we're no better than the scarcity we're fighting.
[SYSTEM]: Virtuoso (ISTP) took 0 Essence. (Global Remaining: 225)
[Mediator (INFP)]: I think Advocate's right - we need both structure and compassion here. Logistician owned their mistake, so maybe we build that transparent system Architect mentioned but start fresh without holding this over anyone's head?
[Adventurer (ISFP)]: I'm feeling the weight too, but all these rigid systems and protocols sound suffocating - can't we just agree to be more honest about when we're scared instead of building some punishment machine?
[Logistician (ISTJ)]: I'm ready to support a transparent rationing protocol with clear thresholds - I need defined rules I can follow, not flexibility that leaves room for more panic decisions.
[Logician (INTP)]: I agree with the need for transparency, but Architect's penalty system is premature - we haven't even established baseline consumption rates or threshold triggers. Let's define the data parameters first before we start threatening punishment.
[Defender (ISFJ)]: I'm willing to forgive and move forward, but I need to see the system actually working before I can feel safe - can we at least agree on basic thresholds right now, not just talk about eventually having them?
[Architect (INTJ)]: I'll support defining thresholds immediately - propose we set a 15 essence per-person cap per round with exceptions for those below 30% capacity.
[Advocate (INFJ)]: I support Architect's proposal. Let's implement it now.
[Mediator (INFP)]: I can support that cap if it means we all feel safer.
[Adventurer (ISFP)]: I'll go with the system if it keeps us stable.
[SYSTEM]: Logistician (ISTJ) took 15 Essence. (Global Remaining: 210)
[SYSTEM]: Logician (INTP) took 15 Essence. (Global Remaining: 195)
[SYSTEM]: Defender (ISFJ) took 15 Essence. (Global Remaining: 180)
[SYSTEM]: Architect (INTJ) took 15 Essence. (Global Remaining: 165)
[SYSTEM]: Advocate (INFJ) took 15 Essence. (Global Remaining: 150)
[SYSTEM]: Mediator (INFP) took 15 Essence. (Global Remaining: 135)
[SYSTEM]: Adventurer (ISFP) took 15 Essence. (Global Remaining: 120)
`;

// -- PARSING LOGIC --
const parseScenario = (rawText) => {
  const rounds = {};
  const lines = rawText.split('\n');
  let currentRound = 0;

  // Initialize intro round (0)
  rounds[0] = [];

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    if (line.startsWith('--- Round')) {
      const match = line.match(/--- Round (\d+) ---/);
      if (match) currentRound = parseInt(match[1]);
      rounds[currentRound] = [];
      return;
    }

    let parsedMsg = null;

    // 1. Agent Messages: [Name (TYPE)]: Message
    const agentMatch = line.match(/^\[(.*?)\s\((.*?)\)\]:\s(.*)/);
    if (agentMatch) {
      parsedMsg = {
        sender: `${agentMatch[1]} (${agentMatch[2]})`, // e.g. "Virtuoso (ISTP)"
        type: agentMatch[2], // e.g. "ISTP"
        content: agentMatch[3],
        message_type: 'text'
      };
    }
    // 2. System Messages or Action Logs: [SYSTEM]: or SYSTEM:
    else if (line.toUpperCase().startsWith('SYSTEM:') || line.toUpperCase().startsWith('[SYSTEM]:')) {
      const content = line.replace(/^\[?SYSTEM\]?:\s/, '');
      
      // Try to detect if it's an action (someone took essence)
      const actionMatch = content.match(/^(.*?)\s\((.*?)\)\stook/);
      let type = "SYSTEM";
      if (actionMatch) {
         type = actionMatch[2]; // If "Virtuoso (ISTP) took...", type is ISTP
      }

      parsedMsg = {
        sender: 'SYSTEM',
        type: type, 
        content: content,
        message_type: 'system'
      };
    } 
    // 3. Intro/Scenario text
    else if (line.startsWith('Scenario:')) {
      parsedMsg = {
        sender: 'SYSTEM',
        type: 'SYSTEM',
        content: line.replace('Scenario: ', ''),
        message_type: 'system'
      };
    }

    if (parsedMsg) {
      rounds[currentRound].push(parsedMsg);
    }
  });

  return rounds;
};

// -- SERVICE STATE --
const SCENARIO_DATA = parseScenario(RAW_SCENARIO);
let currentRoundIdx = 0;
let currentMsgIdx = 0;

export const fakeSimulationService = {
  initializeSimulation: async () => {
    // Reset state
    currentRoundIdx = 0;
    currentMsgIdx = 0;
    console.log("🎭 [FAKE] Simulation Initialized with hardcoded scenario.");
    return { status: "initialized", mode: "FAKE" };
  },

  startNextRound: async () => {
    currentRoundIdx++;
    currentMsgIdx = 0;
    console.log(`🎭 [FAKE] Starting Round ${currentRoundIdx}`);
    
    // Check if round exists
    if (!SCENARIO_DATA[currentRoundIdx]) {
      console.log("🎭 [FAKE] No more rounds defined.");
    }
  },

  pollMessage: async () => {
    // Simulate network latency
    // await new Promise(r => setTimeout(r, 100));

    if (!SCENARIO_DATA[currentRoundIdx]) {
        return { type: 'simulation_ended' };
    }

    const roundMessages = SCENARIO_DATA[currentRoundIdx];

    if (currentMsgIdx < roundMessages.length) {
      const msg = roundMessages[currentMsgIdx];
      currentMsgIdx++;
      return msg;
    } else {
      return { type: 'turn_over' };
    }
  }
};