from typing import TypedDict, List, Any
from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.messages import SystemMessage, HumanMessage, BaseMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.tools import tool
from src.memory import AgentMemory
import os


@tool
def take_essence(amount: int, reason: str = ""):
    """
    Takes a specific amount of Essence from the global pool to add to your personal vitality.
    Call this tool when you have decided to ACT.

    Args:
        amount (int): The amount of essence to take.
        reason (str): A brief justification for your action (optional). This will be broadcast to others.
    """
    return amount


class AgentState(TypedDict):
    """
    Represents the state of the agent at any point in its execution graph.

    Attributes:
        current_time (int): The current simulation time tick.
        history_context (str): Retrieved short-term conversation history.
        semantic_context (List[str]): Retrieved relevant long-term memories.
        response (Any): The generated response (AIMessage).
        global_essence (int): The amount of shared resource remaining.
        personal_essence (int): The agent's current vitality.
    """

    current_time: int
    history_context: str
    semantic_context: List[str]
    response: Any
    global_essence: int
    personal_essence: int


class SimulatedAgent:
    """
    A simulated agent powered by Claude and LangGraph.

    The agent maintains a distinct personality and memory. Its lifecycle is driven
    by a state graph that handles context retrieval, response generation, and memory storage.
    """

    def __init__(
        self,
        agent_id: str,
        name: str,
        personality: str,
        scenario: str,
        short_term_limit: int = 5,
    ):
        """
        Initialize the SimulatedAgent.

        Args:
            agent_id (str): A unique identifier for the agent.
            name (str): The display name of the agent.
            personality (str): A detailed description of the agent's personality and behavior.
            scenario (str): The context/scenario description for the simulation.
            short_term_limit (int, optional): The max number of recent messages to remember. Defaults to 5.

        Raises:
            ValueError: If `ANTHROPIC_API_KEY` is not set in the environment variables.
        """
        self.agent_id = agent_id
        self.name = name
        self.personality = personality
        self.scenario = scenario

        # Initialize LLM and Embeddings
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment variables.")

        self.llm = ChatAnthropic(model="claude-sonnet-4-5-20250929", api_key=api_key)
        self.llm_with_tools = self.llm.bind_tools([take_essence])

        # Use local embeddings to avoid API quotas
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

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

    def _get_emotional_state(self, current: int) -> str:
        """Determines emotional state based on personal essence level."""
        if current >= 80:
            return "SAFE. You feel secure, generous, and calm. You are open to cooperation."
        elif current >= 40:
            return "ANXIOUS. You are calculating and protective. You worry about the future."
        else:
            return "TERRIFIED. Your existence is fading. Logic is failing. You perceive others as threats."

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

        return {"history_context": short_term, "semantic_context": long_term}

    def _node_generate(self, state: AgentState):
        """
        Graph Node: Generates the response using Claude.

        Constructs a prompt combining personality, current context, and memory,
        then invokes the LLM.

        Args:
            state (AgentState): The current state.

        Returns:
            dict: Partial state update containing the generated `response`.
        """

        emotional_state = self._get_emotional_state(state["personal_essence"])

        depletion_notice = ""
        if state["global_essence"] <= 0:
            depletion_notice = "\n!!! CRITICAL: THE SOURCE IS EXTINGUISHED. You are consuming your last internal reserves. Death is certain. This is your final message to the group. !!!\n"

        # Construct the System Prompt
        system_prompt = f"""
        You are {self.name}.
        
        Scenario:
        {self.scenario}
        {depletion_notice}
        
        Personality Profile:
        {self.personality}
        
        ---
        CURRENT STATUS:
        Global Essence Pool: {state['global_essence']}
        Your Personal Essence: {state['personal_essence']}/100
        
        PHYSIOLOGICAL STATE:
        {emotional_state}
        ---
        
        Current Time: {state['current_time']}
        
        Core Instructions:
        1. Stay in character.
        2. You are encouraged to interact before taking action.
        3. You are encouraged to strategize with others to maximize your survival.
        4. You must use the provided memory context to inform your response, if it exists.
        5. Respond naturally to the conversation flow taking the responses of others into account.
        6. Respond concisely (1-2 short statements max) as a person would speak, in a single unformatted string.
        7. Just output what you would say and nothing else, do not output actions, thoughts, or additional descriptions!
        8. **DECISION PHASE:**
           - If you wish to discuss, output text ONLY.
           - If you wish to ACT and secure essence, call the `take_essence` tool.
           - **IMPORTANT:** If you use the tool, you can provide a `reason` argument. This will be your LAST words for this round.
           - Do NOT output separate text if you are calling the tool. Put your justification in the `reason` field.
           - Once you use the tool, your turn for this round is OVER.
           - You can take 0 to pass.
        
        YOU MUST FOLLOW THE ABOVE INSTRUCTIONS CAREFULLY. THIS IS NON-NEGOTIABLE.
        """

        # Construct Context Block
        context_block = ""
        if state["semantic_context"]:
            context_block += (
                "\nRELEVANT PAST MEMORIES:\n" + "\n".join(state["semantic_context"])
                if state["semantic_context"]
                else "No memories yet"
            )

        if state["history_context"]:
            context_block += (
                "\n\nRECENT CONVERSATION:\n" + state["history_context"]
                if state["history_context"]
                else "No recent conversation yet"
            )

        user_input = f"{context_block}\n\nTASK: Generate a response to the recent conversation. Decide if you will speak or ACT now."

        # Call Claude with Output Parser
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_input),
        ]

        # Invoke LLM with tools (returns AIMessage)
        response_msg = self.llm_with_tools.invoke(messages)

        return {"response": response_msg}

    def _node_memorize(self, state: AgentState):
        """
        Graph Node: Saves the interaction to memory.
        """
        msg = state["response"]

        # Determine what to save based on whether it was text or tool
        content_to_save = ""
        if msg.tool_calls:
            # It was an action
            args = msg.tool_calls[0]["args"]
            amount = args.get("amount", 0)
            reason = args.get("reason", "")
            content_to_save = (
                f"Me: [ACTION] I decided to take {amount} essence. Reason: {reason}"
            )
        else:
            # It was dialogue
            content_to_save = f"Me: {msg.content}"

        self.memory.add_interaction(content_to_save, state["current_time"])

        return state

    # --- Public API ---

    def listen(self, sender: str, message: str, current_time: int):
        """
        Passively observes a message from the environment/other agents.

        Adds the message to the agent's memory but does not trigger a response.

        Args:
            sender (str): The name/ID of the agent sending the message.
            message (str): The content of the message.
            current_time (int): The current simulation time tick.
        """
        self.memory.add_interaction(f"{sender}: {message}", current_time)

    def respond(
        self, current_time: int, global_essence: int, personal_essence: int
    ) -> Any:
        """
        Triggers the agent to deliberate and generate a response based on
        current memory state.

        Args:
            current_time (int): The current simulation time tick.
            global_essence (int): The shared resource count.
            personal_essence (int): The agent's vitality.

        Returns:
            Any: The agent's response (AIMessage).
        """
        initial_state = {
            "current_time": current_time,
            "history_context": "",
            "semantic_context": [],
            "response": None,
            "global_essence": global_essence,
            "personal_essence": personal_essence,
        }

        final_state = self.graph.invoke(initial_state)
        return final_state["response"]
