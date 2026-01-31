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
from typing import List, Dict
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
        for agent_cfg in self.config["agents"]:
            agent = SimulatedAgent(
                agent_id=agent_cfg["id"],
                name=agent_cfg["name"],
                personality=agent_cfg["personality"],
                short_term_limit=self.short_term_limit
            )
            self.agents.append(agent)
            print(f" - {agent.name} is ready.")
        print("-" * 50)

    def broadcast(self, sender_name: str, message: str):
        """
        Sends a message to ALL agents (including the sender, for memory consistency, 
        though usually the sender remembers their own speech via the 'memorize' node).
        
        Actually, in our design:
        1. Sender 'memorizes' their own output in the 'respond' phase.
        2. We only need to tell the *other* agents to 'listen'.
        """
        print(f"\n[{sender_name}]: {message}")
        
        for agent in self.agents:
            if agent.name != sender_name:
                agent.listen(sender_name, message, self.current_time)

    def start(self):
        """
        Starts the simulation loop.
        """
        print("\n=== STARTING SIMULATION ===\n")
        
        # 1. Broadcast Initial Scenario
        initial_msg = self.scenario.get("initial_message", "Simulation Start.")
        self.broadcast("SYSTEM", initial_msg)
        
        # 2. Main Loop
        round_num = 1
        while round_num <= self.max_rounds:
            print(f"\n--- Round {round_num} ---")
            
            # Round Robin conversation
            for agent in self.agents:
                self.current_time += 1
                
                # Active Agent decides what to say
                response = agent.respond(self.current_time)
                
                # Broadcast result
                self.broadcast(agent.name, response)
                
                # Small delay for readability
                time.sleep(1)
            
            round_num += 1
            
        print("\n=== SIMULATION ENDED ===")
