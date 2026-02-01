"""
Main entry point for the Fading Light agent simulation.

This script loads the configuration and launches the SimulationEngine,
which manages the multi-agent interaction loop.
"""

import os
from dotenv import load_dotenv
from src.engine import SimulationEngine

def main():
    """
    Main execution entry point.
    
    1. Loads environment variables.
    2. Initializes the SimulationEngine.
    3. Starts the simulation.
    """
    # Load environment variables
    load_dotenv()
    
    # Check API Key
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY not found. Please create a .env file.")
        return

    # Initialize and Start Engine
    try:
        engine = SimulationEngine()
        engine.start()
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    main()
