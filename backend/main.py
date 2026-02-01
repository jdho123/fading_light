"""
FastAPI entry point for the Fading Light agent simulation.
"""

import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from src.engine import SimulationEngine

# Load environment variables
load_dotenv()

app = FastAPI(title="Fading Light API")

# Initialize global engine instance
# It loads defaults from config/agents.yaml automatically on init
engine = SimulationEngine()

# --- Models ---

class SettingsUpdate(BaseModel):
    global_initial: Optional[int] = None
    global_replenish: Optional[int] = None
    agent_decay: Optional[int] = None
    max_rounds: Optional[int] = None

class AgentSelection(BaseModel):
    agent_ids: List[str]

# --- Endpoints ---

@app.get("/")
async def root():
    return {"message": "Fading Light API is running."}

@app.post("/settings")
async def update_settings(settings: SettingsUpdate):
    """Update simulation configuration constants."""
    engine.update_settings(settings.dict(exclude_unset=True))
    return {"message": "Settings updated successfully.", "current_resource": engine.global_resource}

@app.post("/agents")
async def select_agents(selection: AgentSelection):
    """
    Select which agents will participate and reset the simulation state.
    This does NOT start generation.
    """
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set on server.")
    
    engine.select_agents(selection.agent_ids)
    return {
        "message": f"Simulation initialized with {len(engine.agents)} agents.",
        "agents": [a.name for a in engine.agents]
    }

@app.get("/generate-turn")
async def generate_turn():
    """
    Triggers the engine to process a single turn (blocking).
    If the round is over, it will trigger the next round initialization.
    """
    if not engine.is_running:
        raise HTTPException(status_code=400, detail="Simulation not initialized. Call /agents first.")
    
    result = engine.generate_turn()
    return result

@app.get("/get-message")
async def get_message():
    """
    Polls for the next available message or status update.
    Returns:
    - { "type": "text", "sender": "...", "content": "..." }
    - { "type": "turn_over" }
    - { "type": "simulation_ended" }
    - { "type": "none" }
    """
    msg = engine.get_next_message()
    if msg:
        return msg
    return {"type": "none"}

# To run: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)