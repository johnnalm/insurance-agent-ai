import os
import logging
from typing import Annotated

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode, tools_condition

# Use MessagesState for agent state management
from langgraph.graph.message import MessagesState, add_messages

from dotenv import load_dotenv

from .vector_store import get_vector_store

# Import the function to build the agent executor
from .graph import build_agent_executor

load_dotenv()

# Setup basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Print the API key for debugging
logger.info(f"OpenAI API Key Loaded: '{os.getenv('OPENAI_API_KEY')[:5]}...'") # Print first 5 chars for security

# --- RAG Components (Adapted for Tool) ---
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def log_retrieved_docs(docs):
    # Simplified logging for tool context
    if docs:
        logger.info(f"Retrieved {len(docs)} documents for RAG tool.")
    else:
        logger.info("No documents retrieved for RAG tool.")
    return docs

# --- Tool Definitions ---

@tool
def policy_rag_tool(query: str) -> str:
    """Searches and answers questions about insurance policies using internal knowledge."""
    logger.info(f"Executing RAG tool for user query: '{query}'") # Log original query
    try:
        vector_store = get_vector_store()
        # Consider making retriever k configurable or logging it
        retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={'k': 3})
        logger.info(f"Retriever configured with k=3. Invoking with processed query (if any modifications were made by agent before tool call).")

        # Directly use the query for retrieval for now.
        # If the agent modifies the query before calling the tool, that modified query would be used.
        retrieved_docs = retriever.invoke(query) # Get raw docs

        logger.info(f"Retriever returned {len(retrieved_docs)} documents.")
        if retrieved_docs:
            for i, doc in enumerate(retrieved_docs):
                logger.info(f"Doc {i+1} (first 100 chars): {doc.page_content[:100]}...")
                logger.info(f"Doc {i+1} metadata: {doc.metadata}")

        # Simplified RAG chain for tool - Agent LLM will handle final answer synthesis
        # The log_retrieved_docs and format_docs are now effectively done above for logging
        # and below for context assembly.

        if not retrieved_docs:
            return "No relevant policy information found in the internal knowledge base for the query."

        context = "\n\n".join(doc.page_content for doc in retrieved_docs)
        # Return context for the agent to synthesize the answer
        return f"""Retrieved context:
{context}"""
    except Exception as e:
        logger.error(f"Error in RAG tool: {e}", exc_info=True)
        return "Error executing the policy RAG tool."

# Requires TAVILY_API_KEY environment variable
# Ensure tavily-python is installed: pip install tavily-python
try:
    tavily_tool = TavilySearchResults(max_results=3)
    tavily_tool.name = "web_search_tool"
    tavily_tool.description = "Searches the web for information, especially useful for current regulations or general insurance knowledge not found in internal policies."
    tools = [policy_rag_tool, tavily_tool]
    logger.info("Tools initialized successfully (RAG, Tavily).")
except Exception as e:
    logger.error(f"Failed to initialize Tavily Search tool. Ensure TAVILY_API_KEY is set and tavily-python is installed: {e}", exc_info=True)
    # Fallback to only RAG tool if Tavily fails
    tools = [policy_rag_tool]
    logger.warning("Falling back to only using the RAG tool.")


# --- LangGraph Agent Setup ---

# Define the state for the graph
# MessagesState includes 'messages' which is a list of BaseMessages
# We use add_messages to handle appending new messages to the state
class AgentState(MessagesState):
    pass

# Define the function that calls the model
def call_model(state: AgentState, config):
    messages = state['messages']
    # Ensure llm is accessible here, perhaps pass via config or make it global/class member if preferred
    response = llm_with_tools.invoke(messages, config=config)
    # We return a list, because this will get added to the existing list
    return {"messages": [response]}


# Initialize the LLM with tools bound
# Using a model that supports tool calling well, like gpt-4o or gpt-3.5-turbo with recent updates
llm = ChatOpenAI(model="gpt-4o", temperature=0, streaming=True)
llm_with_tools = llm.bind_tools(tools)

# Build the graph
graph_builder = StateGraph(AgentState)

# Define the nodes
graph_builder.add_node("agent", call_model)
tool_node = ToolNode(tools) # ToolNode executes tools and returns ToolMessages
graph_builder.add_node("tools", tool_node)

# Define the edges
graph_builder.set_entry_point("agent")

# Conditional edge: run tools if the agent decided to, otherwise end
graph_builder.add_conditional_edges(
    "agent",
    # This is the function determining which node to call next
    tools_condition,
    # This dictionary routes based on the output of tools_condition
    {
        # If the condition returns "tools", call the tool node.
        "tools": "tools",
        # Otherwise, finish. END is a special node marking the end of the graph.
        END: END,
    },
)

# Edge from tool execution back to the agent to process tool results
graph_builder.add_edge("tools", "agent")

# Compile the graph
agent_executor = graph_builder.compile()
logger.info("LangGraph agent executor compiled successfully.")

# --- Build Agent Executor ---
agent_executor = None
if llm:
    try:
        agent_executor = build_agent_executor(llm)
    except Exception as e:
        # Error already logged in build_agent_executor
        logger.error("Agent executor could not be built.")
else:
    logger.error("LLM not available, cannot build agent executor.")

# --- Main Function to Interact with Agent ---
def get_agent_response(query: str, config: dict = None) -> str:
    """Gets a response from the LangGraph agent for the given query."""
    if not agent_executor:
        logger.error("Agent executor is not available.")
        raise Exception("LangGraph agent executor not initialized or failed to build.")

    if not query:
        return "Please provide a query."

    logger.info(f"Invoking agent with query: '{query}'")
    try:
        # Ensure config has a thread_id for state management
        if config is None:
            config = {"configurable": {"thread_id": "default_thread"}}
        elif "configurable" not in config or "thread_id" not in config["configurable"]:
            config.setdefault("configurable", {})["thread_id"] = "default_thread"
            logger.warning(f"Using default thread_id: {config['configurable']['thread_id']}")

        final_state = agent_executor.invoke({"messages": [HumanMessage(content=query)]}, config=config)

        # Extract the final response from the last AI message without tool calls
        final_response_message = None
        if final_state and 'messages' in final_state:
             for msg in reversed(final_state['messages']):
                 if isinstance(msg, BaseMessage) and msg.type == "ai" and not getattr(msg, 'tool_calls', None):
                     final_response_message = msg
                     break # Found the last relevant AI response

        if final_response_message:
            response_content = final_response_message.content
            logger.info(f"Agent final response: '{response_content}'")
            return response_content
        else:
            logger.warning(f"Agent finished, but could not extract a final AI response. Full state: {final_state}")
            return "Agent finished, but could not extract a final response."

    except Exception as e:
        logger.error(f"Error invoking agent executor: {e}", exc_info=True)
        return "An error occurred while processing your request."

# Example usage (can be uncommented for direct testing)
# if __name__ == '__main__':
#     # Ensure keys are loaded if running directly
#     if "TAVILY_API_KEY" not in os.environ:
#         logger.warning("TAVILY_API_KEY not found in environment. Web search tool may not function.")
#     if "OPENAI_API_KEY" not in os.environ:
#         logger.error("OPENAI_API_KEY not found. Agent cannot function.")
#         exit()
#
#     # Use unique thread_ids for concurrent requests or separate conversations
#     thread_id_1 = "test-thread-rag"
#     thread_id_2 = "test-thread-web"
#
#     test_query_rag = "What is the standard deductible for policy XYZ?"
#     print("--- RAG Query ---")
#     response_rag = get_agent_response(test_query_rag, config={"configurable": {"thread_id": thread_id_1}})
#     print(f"Query: {test_query_rag}")
#     print(f"Response: {response_rag}")
#     print("------")
#
#     test_query_web = "What are the latest insurance regulations for autonomous vehicles in California?"
#     print("--- Web Query ---")
#     response_web = get_agent_response(test_query_web, config={"configurable": {"thread_id": thread_id_2}})
#     print(f"Query: {test_query_web}")
#     print(f"Response: {response_web}")
#     print("------")
#
#     # Example of continuing a conversation (using the same thread_id)
#     follow_up_query = "Are there any exceptions to that deductible?"
#     print("--- Follow-up RAG Query ---")
#     response_follow_up = get_agent_response(follow_up_query, config={"configurable": {"thread_id": thread_id_1}})
#     print(f"Query: {follow_up_query}")
#     print(f"Response: {response_follow_up}")
#     print("------")

# Clean up old code no longer needed
# def initialize_rag_chain(): ... (removed)
# rag_chain = initialize_rag_chain() (removed)
# def get_rag_response(query: str) -> str: ... (replaced by get_agent_response)

# Final structure adjustment: Move logging config up top
# Ensure vector_store import is correct relative to this file path
# Ensure necessary packages (langgraph, langchain-openai, langchain-community, tavily-python, python-dotenv) are installed.
