"""
Orchestration engine for the Fading Light simulation.
Refactored for API usage with step-based execution.
"""

import time
import yaml
import random
import re
from typing import List, Dict, Set, Optional
from src.agent import SimulatedAgent

class SimulationEngine:
    """
    The central controller for the multi-agent simulation.
    """

    def __init__(self, config_path: str = "config/agents.yaml"):
        """
        Initialize the engine with default configuration.
        """
        self.config_path = config_path
        self.config = self._load_config(config_path)
        
        # Core State
        self.agents: List[SimulatedAgent] = []
        self.current_time = 0
        self.round_num = 0
        self.global_resource = 0
        self.agent_resources: Dict[str, int] = {}
        
        # Message Queue for polling
        self.message_queue: List[Dict] = []
        
        # Queues for the current round
        self.pending_agents: List[SimulatedAgent] = []
        self.agents_done: Set[str] = set()
        self.turns_in_round = 0
        self.is_running = False

        # Load initial defaults
        self.reset_to_defaults()

    def _load_config(self, path: str) -> dict:
        with open(path, "r") as f:
            return yaml.safe_load(f)

    def reset_to_defaults(self):
        """Resets the engine using the current config file."""
        self.settings = self.config.get("settings", {})
        self.res_config = self.config.get("resources", {})
        self.scenario = self.config.get("scenario", {})
        
        self.global_resource = self.res_config.get("global_initial", 200)
        self.max_rounds = self.scenario.get("max_rounds", 5)
        self.max_discussion_turns = self.res_config.get("max_discussion_turns", 40)
        self.short_term_limit = self.settings.get("short_term_limit", 8)
        
        self.agents = []
        self.agent_resources = {}
        self.message_queue = []
        self.pending_agents = []
        self.agents_done = set()
        self.round_num = 0
        self.current_time = 0
        self.is_running = False

    def update_settings(self, new_settings: Dict):
        """Updates specific resource or scenario settings."""
        if "global_initial" in new_settings:
            self.global_resource = new_settings["global_initial"]
        if "max_rounds" in new_settings:
            self.max_rounds = new_settings["max_rounds"]
        if "global_replenish" in new_settings:
            self.res_config["global_replenish"] = new_settings["global_replenish"]
        if "agent_decay" in new_settings:
            self.res_config["agent_decay"] = new_settings["agent_decay"]

    def select_agents(self, agent_ids: List[str]):
        """Initializes only the selected subset of agents."""
        print(f"Initializing Selected Agents: {agent_ids}")
        self.agents = []
        self.agent_resources = {}
        
        scenario_text = self.scenario.get("initial_message", "Simulation Start.")
        initial_agent_res = self.res_config.get("agent_initial", 70)
        
        # Find agent configs in the main list
        for agent_id in agent_ids:
            agent_cfg = next((a for a in self.config["agents"] if a["id"] == agent_id), None)
            if agent_cfg:
                agent = SimulatedAgent(
                    agent_id=agent_cfg["id"],
                    name=agent_cfg["name"],
                    personality=agent_cfg["personality"],
                    scenario=scenario_text,
                    short_term_limit=self.short_term_limit
                )
                self.agents.append(agent)
                self.agent_resources[agent.agent_id] = initial_agent_res
        
        self.is_running = True
        self.round_num = 0
        self._push_message("SYSTEM", f"Simulation initialized with {len(self.agents)} agents.")

    def _push_message(self, sender: str, content: str, msg_type: str = "text"):
        """Internal helper to queue messages for polling."""
        self.message_queue.append({
            "sender": sender,
            "content": content,
            "type": msg_type,
            "timestamp": time.time()
        })

    def broadcast(self, sender_name: str, message: str):
        """Standard broadcast that also queues for API."""
        self._push_message(sender_name, message)
        for agent in self.agents:
            if agent.name != sender_name:
                agent.listen(sender_name, message, self.current_time)

    def get_next_message(self) -> Optional[Dict]:
        """Returns the oldest message in the queue (FIFO)."""
        if self.message_queue:
            return self.message_queue.pop(0)
        
        # If no messages but round is over, return special signal
        if self.is_running and self.round_num > 0 and not self.pending_agents and not self.message_queue:
            # We check if we are actually at the end of the simulation too
            if self.round_num >= self.max_rounds:
                return {"type": "simulation_ended"}
            return {"type": "turn_over"}
            
        return None

    def start_new_round(self):
        """Prepares the state for a new round."""
        self.round_num += 1
        self.turns_in_round = 0
        self.agents_done = set()
        
        self._push_message("SYSTEM", f"--- Starting Round {self.round_num} ---", "round_start")
        
        # 1. Replenish
        replenish = self.res_config.get("global_replenish", 0)
        self.global_resource += replenish
        self._push_message("SYSTEM", f"Global Essence replenishes by {replenish}. Total: {self.global_resource}")

        # 2. Decay & Death Check
        decay = self.res_config.get("agent_decay", 10)
        active_agents = []
        for agent in self.agents:
            aid = agent.agent_id
            if self.agent_resources[aid] > 0:
                self.agent_resources[aid] -= decay
                if self.agent_resources[aid] <= 0:
                    self.agent_resources[aid] = 0
                    self.broadcast("SYSTEM", f"{agent.name} has faded away.")
                else:
                    active_agents.append(agent)

        if not active_agents:
            self._push_message("SYSTEM", "All agents have faded. Simulation Over.", "simulation_ended")
            self.is_running = False
            return

        # 3. Shuffle queue
        random.shuffle(active_agents)
        self.pending_agents = active_agents

    def generate_round(self) -> Dict:
        """
        Processes an entire round of the simulation.
        If the round hasn't started, it initializes it.
        Then it loops until all agents have acted or the turn limit is reached.
        """
        if not self.is_running:
            return {"error": "Simulation not initialized or has ended."}

        # 1. Start a new round if we aren't in one
        if not self.pending_agents:
            if self.round_num >= self.max_rounds:
                return {"status": "simulation_ended"}
            self.start_new_round()

        # 2. Process turns until the round is complete
        # A round is complete when pending_agents is empty 
        # (either because they all acted or the turn limit hit)
        start_round = self.round_num
        while self.pending_agents and self.round_num == start_round:
            self._step_once()
            
        return {
            "status": "round_completed",
            "round": self.round_num
        }

    def _step_once(self):
        """Internal helper to process a single agent's turn."""
        if not self.pending_agents:
            return

        agent = self.pending_agents.pop(0)
        
        self.current_time += 1
        self.turns_in_round += 1
        
        # Agent decides
        response_msg = agent.respond(
            current_time=self.current_time,
            global_essence=self.global_resource,
            personal_essence=self.agent_resources[agent.agent_id]
        )
        
        # Process Action
        action_taken = self._process_take_action(agent, response_msg)
        
        if action_taken:
            self.agents_done.add(agent.agent_id)
        else:
            # If no action, it was dialogue. 
            # Dialogue agents remain in the pending list for next cycles until they act.
            # We put them at the end of the queue.
            content = response_msg.content
            if content:
                self.broadcast(agent.name, content)
            self.pending_agents.append(agent)

        # Check for discussion turn limit
        if self.turns_in_round >= self.max_discussion_turns:
            self._push_message("SYSTEM", "Discussion limit reached. Round ending.")
            self.pending_agents = [] # Clear queue to force end of round

    def _process_take_action(self, agent: SimulatedAgent, response_message) -> bool:
        """Inspects for tool calls and updates state."""
        if hasattr(response_message, 'tool_calls') and response_message.tool_calls:
            for tool_call in response_message.tool_calls:
                if tool_call['name'] == 'take_essence':
                    args = tool_call['args']
                    amount = args.get('amount', 0)
                    reason = args.get('reason', "")
                    
                    actual_taken = min(amount, self.global_resource)
                    self.global_resource -= actual_taken
                    self.agent_resources[agent.agent_id] += actual_taken
                    
                    broadcast_msg = f"{agent.name} took {actual_taken} Essence. (Global Remaining: {self.global_resource})"
                    if reason:
                        broadcast_msg += f"\n   Reason: \"{reason}\""
                    
                    self.broadcast("SYSTEM", broadcast_msg)
                    return True
        return False