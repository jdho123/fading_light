"""
Core agent logic for the Simulated Agent.

This module defines the `SimulatedAgent` class, which uses a LangGraph workflow to
manage the cognitive cycle of an agent: Recall -> Generate -> Memorize.
"""

from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.messages import SystemMessage, HumanMessage
from src.memory import AgentMemory
import os

class AgentState(TypedDict):
    """
    Represents the state of the agent at any point in its execution graph.

    Attributes:
        current_time (int): The current simulation time tick.
        history_context (str): Retrieved short-term conversation history.
        semantic_context (List[str]): Retrieved relevant long-term memories.
        response (str): The generated response text.
    """
    current_time: int
    history_context: str
    semantic_context: List[str]
    response: str

class SimulatedAgent:
    """
    A simulated agent powered by Gemini and LangGraph.

    The agent maintains a distinct personality and memory. Its lifecycle is driven
    by a state graph that handles context retrieval, response generation, and memory storage.
    """

    def __init__(self, agent_id: str, name: str, personality: str, short_term_limit: int = 5):
        """
        Initialize the SimulatedAgent.

        Args:
            agent_id (str): A unique identifier for the agent.
            name (str): The display name of the agent.
            personality (str): A detailed description of the agent's personality and behavior.
            short_term_limit (int, optional): The max number of recent messages to remember. Defaults to 5.

        Raises:
            ValueError: If `GOOGLE_API_KEY` is not set in the environment variables.
        """
        self.agent_id = agent_id
        self.name = name
        self.personality = personality
        
        # Initialize LLM and Embeddings
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables.")
            
        self.llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=api_key)
        
        # Initialize Memory
        self.memory = AgentMemory(self.embeddings, short_term_limit=short_term_limit)
        
        # Initialize Graph
        self.graph = self._build_graph()

    def _build_graph(self):
        """
        Constructs the LangGraph state graph for the agent's workflow.

        Returns:
            CompiledGraph: The compiled executable graph.
        """
        # Define the nodes
        workflow = StateGraph(AgentState)

        workflow.add_node("recall", self._node_recall)
        workflow.add_node("generate", self._node_generate)
        workflow.add_node("memorize", self._node_memorize)

        # Define edges
        workflow.set_entry_point("recall")
        workflow.add_edge("recall", "generate")
        workflow.add_edge("generate", "memorize")
        workflow.add_edge("memorize", END)

        return workflow.compile()

    # --- Nodes ---
    
    def _node_recall(self, state: AgentState):
        """
        Graph Node: Retrieves context from memory.

        Fetches recent short-term history and queries long-term memory.
        It uses the recent conversation history (up to short_term_limit) as the search query.

        Args:
            state (AgentState): The current state.

        Returns:
            dict: Partial state update containing `history_context` and `semantic_context`.
        """
        # Get Short term (recent chat)
        short_term = self.memory.get_short_term_context()
        
        # Determine query for long-term memory
        # We use the entire short-term history context as the trigger for semantic retrieval.
        query = short_term
        
        # Get Long term (semantic search)
        long_term = []
        if query:
            long_term = self.memory.retrieve_relevant(query)
        
        return {
            "history_context": short_term,
            "semantic_context": long_term
        }

    def _node_generate(self, state: AgentState):
        """
        Graph Node: Generates the response using Gemini.

        Constructs a prompt combining personality, current context, and memory,
        then invokes the LLM.

        Args:
            state (AgentState): The current state.

        Returns:
            dict: Partial state update containing the generated `response`.
        """
        
        # Construct the System Prompt
        system_prompt = f"""
        You are {self.name}. 
        
        Personality Profile:
        {self.personality}
        
        Current Time: {state['current_time']}
        
        Core Instructions:
        1. Stay in character.
        2. Use the provided memory context to inform your response.
        3. Respond naturally to the conversation flow.
        """
        
        # Construct Context Block
        context_block = ""
        if state["semantic_context"]:
            context_block += "\nRELEVANT PAST MEMORIES:\n" + "\n".join(state["semantic_context"])
        
        if state["history_context"]:
            context_block += "\n\nRECENT CONVERSATION:\n" + state["history_context"]
            
        user_input = f"{context_block}\n\nTASK: Generate a response to the recent conversation."
        
        # Call Gemini
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_input)
        ]
        
        result = self.llm.invoke(messages)
        return {"response": result.content}

    def _node_memorize(self, state: AgentState):
        """
        Graph Node: Saves the interaction to memory.

        Stores ONLY the agent's response into the memory system.
        (Incoming messages are handled by `listen`).

        Args:
            state (AgentState): The current state.

        Returns:
            AgentState: The state.
        """
        # Save the Agent's response
        self.memory.add_interaction(f"Me: {state['response']}", state['current_time'])
        
        return state

    # --- Public API ---

    def listen(self, message: str, current_time: int):
        """
        Passively observes a message from the environment/other agents.
        
        Adds the message to the agent's memory but does not trigger a response.

        Args:
            message (str): The content of the message.
            current_time (int): The current simulation time tick.
        """
        self.memory.add_interaction(f"Others: {message}", current_time)

    def respond(self, current_time: int) -> str:
        """
        Triggers the agent to deliberate and generate a response based on 
        current memory state.

        Args:
            current_time (int): The current simulation time tick.

        Returns:
            str: The agent's text response.
        """
        initial_state = {
            "current_time": current_time,
            "history_context": "",
            "semantic_context": [],
            "response": ""
        }
        
        final_state = self.graph.invoke(initial_state)
        return final_state["response"]