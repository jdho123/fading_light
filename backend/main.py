"""
FastAPI entry point for the Fading Light agent simulation.
"""

import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
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

# --- Endpoints ---

@app.get("/")
async def root():
    return {"message": "Fading Light API is running."}

@app.post("/settings")
async def update_settings(settings: SettingsUpdate):
    """Update simulation configuration constants."""
    engine.update_settings(settings.dict(exclude_unset=True))
    return {"message": "Settings updated successfully.", "current_resource": engine.global_resource}

@app.post("/reset")
async def reset_simulation():
    """Reset the simulation engine to fresh state."""
    engine.reset_to_defaults()
    return {"message": "Simulation reset successfully."}

@app.get("/generate-turn")
async def generate_turn(background_tasks: BackgroundTasks):
    """
    Triggers the engine to process an entire round in the background.
    Automatically initializes with all agents if not already running.
    """
    if not engine.is_running:
        if not os.getenv("ANTHROPIC_API_KEY"):
            raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set on server.")
        engine.initialize_simulation()
    
    if engine.is_generating:
        return {"status": "already_processing", "message": "A round is already being generated."}
    
    # Run the round in the background
    background_tasks.add_task(engine.run_round_background)
    
    return {"status": "started", "message": "Round generation started in background."}

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