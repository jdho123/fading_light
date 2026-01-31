"""
Memory management module for the Simulated Agent.

This module provides the `AgentMemory` class, which implements a dual-layer memory system
consisting of:
1. Short-term memory: A rolling buffer of recent interactions.
2. Long-term memory: A semantic vector store for retrieving relevant past experiences based on embedding similarity.
"""

import numpy as np
from collections import deque
from dataclasses import dataclass
from typing import List
from langchain_core.embeddings import Embeddings

@dataclass
class MemoryItem:
    """
    Represents a single unit of long-term memory.

    Attributes:
        content (str): The text content of the memory.
        embedding (List[float]): The vector representation of the content.
        timestamp (int): The simulation time tick when this memory was created.
        importance (float): A weight factor for the memory's significance (default 1.0).
    """
    content: str
    embedding: List[float]
    timestamp: int
    importance: float = 1.0

class AgentMemory:
    """
    Manages both short-term (working) and long-term (semantic) memory for an agent.

    The short-term memory acts as a context window for the immediate conversation, while
    the long-term memory allows retrieval of past events based on semantic relevance.
    """

    def __init__(self, embedding_model: Embeddings, short_term_limit: int = 5):
        """
        Initialize the AgentMemory system.

        Args:
            embedding_model (Embeddings): The model used to generate vector embeddings.
            short_term_limit (int, optional): The maximum number of recent messages to keep in short-term memory. Defaults to 5.
        """
        self.embedding_model = embedding_model
        self.short_term = deque(maxlen=short_term_limit)
        self.long_term: List[MemoryItem] = []
        
    def add_interaction(self, content: str, timestamp: int):
        """
        Adds an interaction to both short-term and long-term memory.

        This method updates the rolling buffer of recent context and computes/stores
        the embedding for long-term retrieval.

        Args:
            content (str): The text content of the interaction (e.g., a message sent or received).
            timestamp (int): The current simulation time tick.
        """
        # Add to short term (fifo)
        self.short_term.append(f"[{timestamp}] {content}")
        
        # Add to long term (vector store)
        embedding = self.embedding_model.embed_query(content)
        self.long_term.append(MemoryItem(
            content=content,
            embedding=embedding,
            timestamp=timestamp
        ))

    def retrieve_relevant(self, query: str, top_k: int = 3) -> List[str]:
        """
        Retrieves semantically similar memories from long-term storage.

        Calculates the cosine similarity between the query embedding and stored memory embeddings.

        Args:
            query (str): The search query (usually the current input message).
            top_k (int, optional): The number of top results to return. Defaults to 3.

        Returns:
            List[str]: A list of relevant memory content strings, formatted with timestamps.
        """
        if not self.long_term:
            return []

        query_embedding = self.embedding_model.embed_query(query)
        
        # Calculate cosine similarities
        scores = []
        for item in self.long_term:
            # simple dot product for normalized embeddings (assuming Google's are normalized or close enough for this prototype)
            # If not, we should do dot(a, b) / (norm(a) * norm(b))
            vec_a = np.array(query_embedding)
            vec_b = np.array(item.embedding)
            similarity = np.dot(vec_a, vec_b) / (np.linalg.norm(vec_a) * np.linalg.norm(vec_b))
            scores.append((similarity, item))
            
        # Sort by score descending
        scores.sort(key=lambda x: x[0], reverse=True)
        
        # Return top k content
        return [f"[{item.timestamp}] {item.content}" for _, item in scores[:top_k]]

    def get_short_term_context(self) -> str:
        """
        Retrieves the full content of the short-term memory buffer.

        Returns:
            str: A single string containing all recent messages joined by newlines.
        """
        return "\n".join(self.short_term)
