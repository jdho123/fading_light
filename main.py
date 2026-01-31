"""
Main entry point for the Fading Light agent simulation.

This script loads the configuration, initializes the agent (Elias), and starts
an interactive CLI chat session where you can converse with the agent.
"""

import os
import yaml
import time
from dotenv import load_dotenv
from src.agent import SimulatedAgent

def load_config():
    """
    Loads the agent configuration from the YAML file.

    Returns:
        dict: The parsed configuration dictionary.
    """
    with open("config/agents.yaml", "r") as f:
        return yaml.safe_load(f)

def main():
    """
    Main execution loop.
    
    1. Loads environment variables and config.
    2. Initializes the agent 'Elias'.
    3. Runs a REPL (Read-Eval-Print Loop) for user interaction.
    """
    # Load environment variables
    load_dotenv()
    
    # Check API Key
    if not os.getenv("GOOGLE_API_KEY"):
        print("ERROR: GOOGLE_API_KEY not found. Please create a .env file.")
        return

    # Load Config
    config = load_config()
    
    # Get global settings
    settings = config.get("settings", {})
    short_term_limit = settings.get("short_term_limit", 5)

    # Pick the first agent (Elias)
    agent_cfg = config["agents"][0]
    print(f"Initializing Agent: {agent_cfg['name']} (Memory Limit: {short_term_limit})...")
    
    agent = SimulatedAgent(
        agent_id=agent_cfg["id"],
        name=agent_cfg["name"],
        personality=agent_cfg["personality"],
        short_term_limit=short_term_limit
    )
    
    print(f"\n[{agent.name}] matches initialized. Start chatting! (Type 'exit' to quit)")
    print("-" * 50)
    
    current_time = 0
    
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit"]:
            break
            
        # Simulate time passing
        current_time += 1
        
        try:
            # 1. Agent listens to the user (passive observation)
            agent.listen(user_input, current_time)
            
            # 2. Agent decides how to respond (active deliberation)
            # In a real multi-agent sim, this step might be conditional.
            # Here, we force a response to keep the chat interactive.
            response = agent.respond(current_time)
            
            print(f"{agent.name}: {response}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    main()
