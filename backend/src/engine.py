"""
Orchestration engine for the Fading Light simulation.

This module manages the lifecycle of the simulation, including:
1. Initializing agents from configuration.
2. Managing the global clock and turn order.
3. Broadcasting messages between agents.
4. Handling the main simulation loop.
"""

import time
import yaml
import random
import re
from typing import List, Dict, Set
from src.agent import SimulatedAgent

class SimulationEngine:
    """
    The central controller for the multi-agent simulation.
    """

    def __init__(self, config_path: str = "config/agents.yaml"):
        """
        Initialize the engine by loading configuration and creating agents.

        Args:
            config_path (str): Path to the YAML configuration file.
        """
        self.config = self._load_config(config_path)
        self.agents: List[SimulatedAgent] = []
        self.current_time = 0
        
        # Load global settings
        self.settings = self.config.get("settings", {})
        self.short_term_limit = self.settings.get("short_term_limit", 5)
        
        # Load resources settings
        self.res_config = self.config.get("resources", {})
        self.global_resource = self.res_config.get("global_initial", 50)
        self.max_discussion_turns = self.res_config.get("max_discussion_turns", 20)
        
        # Track Agent Resources
        self.agent_resources: Dict[str, int] = {}
        
        # Load scenario
        self.scenario = self.config.get("scenario", {})
        self.max_rounds = self.scenario.get("max_rounds", 5)
        
        # Initialize Agents
        self._initialize_agents()

    def _load_config(self, path: str) -> dict:
        with open(path, "r") as f:
            return yaml.safe_load(f)

    def _initialize_agents(self):
        """Creates Agent instances based on the configuration."""
        print("Initializing Agents...")
        scenario_text = self.scenario.get("initial_message", "Simulation Start.")
        initial_agent_res = self.res_config.get("agent_initial", 50)
        
        for agent_cfg in self.config["agents"]:
            agent = SimulatedAgent(
                agent_id=agent_cfg["id"],
                name=agent_cfg["name"],
                personality=agent_cfg["personality"],
                scenario=scenario_text,
                short_term_limit=self.short_term_limit
            )
            self.agents.append(agent)
            self.agent_resources[agent.agent_id] = initial_agent_res
            print(f" - {agent.name} is ready. (Essence: {initial_agent_res})")
        print("-" * 50)

    def broadcast(self, sender_name: str, message: str):
        """
        Sends a message to ALL agents (including the sender, for memory consistency).
        """
        print(f"\n[{sender_name}]: {message}")
        
        for agent in self.agents:
            if agent.name != sender_name:
                agent.listen(sender_name, message, self.current_time)

    def _process_take_action(self, agent: SimulatedAgent, response_message) -> bool:
        """
        Inspects the response for tool calls to `take_essence`.
        Returns True if an action was taken, False otherwise.
        """
        # Check if there are tool calls
        if hasattr(response_message, 'tool_calls') and response_message.tool_calls:
            for tool_call in response_message.tool_calls:
                if tool_call['name'] == 'take_essence':
                    args = tool_call['args']
                    amount = args.get('amount', 0)
                    
                    # 1. Validate Available Global Resource
                    actual_taken = min(amount, self.global_resource)
                    
                    # 2. Update Global Pool
                    self.global_resource -= actual_taken
                    
                    # 3. Update Agent Pool
                    current_res = self.agent_resources[agent.agent_id]
                    self.agent_resources[agent.agent_id] = current_res + actual_taken
                    
                    # 4. Broadcast the Event
                    self.broadcast("SYSTEM", f"{agent.name} took {actual_taken} Essence. (Global Remaining: {self.global_resource})")
                    return True
            
        return False

    def start(self):
        """
        Starts the simulation loop.
        """
        print("\n=== STARTING SIMULATION ===\n")
        
        # 1. Print Initial Scenario
        initial_msg = self.scenario.get("initial_message", "Simulation Start.")
        print(f"Scenario: {initial_msg}")
        
        round_num = 1
        while round_num <= self.max_rounds:
            print(f"\n--- Round {round_num} ---")
            
            # A. Replenish Global Resource
            replenish = self.res_config.get("global_replenish", 0)
            self.global_resource += replenish
            print(f"SYSTEM: Global Essence replenishes by {replenish}. Total: {self.global_resource}")

            # B. Apply Decay to Agents
            decay = self.res_config.get("agent_decay", 10)
            print(f"SYSTEM: Living costs {decay} Essence per agent.")
            for agent in self.agents:
                aid = agent.agent_id
                if self.agent_resources[aid] > 0:
                    self.agent_resources[aid] -= decay
                    # Check Death
                    if self.agent_resources[aid] <= 0:
                        self.agent_resources[aid] = 0
                        self.broadcast("SYSTEM", f"{agent.name} has faded away (0 Essence).")

            # C. Discussion & Action Loop
            # Active agents are those still alive
            active_agents = [a for a in self.agents if self.agent_resources[a.agent_id] > 0]
            
            if not active_agents:
                print("SYSTEM: All agents have faded. Simulation Over.")
                break

            # Shuffle order
            random.shuffle(active_agents)
            
            # Track who has locked in their action for this round
            # Set of agent_ids
            agents_done: Set[str] = set()
            
            turns = 0
            while len(agents_done) < len(active_agents) and turns < self.max_discussion_turns:
                for agent in active_agents:
                    if agent.agent_id in agents_done:
                        continue
                        
                    self.current_time += 1
                    turns += 1
                    
                    # Agent decides
                    response_msg = agent.respond(
                        current_time=self.current_time,
                        global_essence=self.global_resource,
                        personal_essence=self.agent_resources[agent.agent_id]
                    )
                    
                    # Check for Action Lock first
                    # If they acted, we do NOT broadcast their text (strict separation)
                    if self._process_take_action(agent, response_msg):
                        agents_done.add(agent.agent_id)
                    else:
                        # If no action, broadcast the dialogue
                        content = response_msg.content
                        if content:
                            self.broadcast(agent.name, content)
                    
                    time.sleep(1)
            
            # Force end of round if limit reached
            if len(agents_done) < len(active_agents):
                print("SYSTEM: Discussion time limit reached. Round ending.")
            
            round_num += 1
            
        print("\n=== SIMULATION ENDED ===")
