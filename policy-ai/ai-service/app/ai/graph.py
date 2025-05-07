import logging
from typing import Annotated
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.messages import BaseMessage

# Import the tools list from the tools package
from .tools import tools

logger = logging.getLogger(__name__)

# Define the state for the graph using MessagesState for convenience
class AgentState(MessagesState):
    pass

# Function that defines how the agent node behaves
def call_agent_model(state: AgentState, config, llm_with_tools):
    """Calls the bound LLM."""
    messages = state['messages']
    logger.debug(f"Calling agent model with messages: {messages}")
    response = llm_with_tools.invoke(messages, config=config)
    logger.debug(f"Agent model response: {response}")
    # Return a list, as add_messages expects an iterable
    return {"messages": [response]}


def build_agent_executor(llm):
    """Builds the LangGraph agent executor."""
    if not tools:
        raise ValueError("No tools available to build the agent executor.")

    llm_with_tools = llm.bind_tools(tools)

    graph_builder = StateGraph(AgentState)

    # Node that calls the agent model
    graph_builder.add_node(
        "agent",
        # Pass the bound LLM to the node function using partial or lambda
        lambda state, config: call_agent_model(state, config, llm_with_tools)
    )

    # Node that executes tools
    tool_node = ToolNode(tools)
    graph_builder.add_node("tools", tool_node)

    # Define the edges
    graph_builder.set_entry_point("agent")

    # Conditional edge: Route based on whether tools were called
    graph_builder.add_conditional_edges(
        "agent",
        tools_condition,
        {
            "tools": "tools",
            END: END,
        },
    )

    # Edge from tool execution back to the agent
    graph_builder.add_edge("tools", "agent")

    # Compile the graph
    try:
        agent_executor = graph_builder.compile()
        logger.info("LangGraph agent executor compiled successfully.")
        return agent_executor
    except Exception as e:
        logger.error(f"Failed to compile LangGraph agent executor: {e}", exc_info=True)
        raise 