import logging
from .rag_tool import policy_rag_tool
from .web_search import tavily_tool

logger = logging.getLogger(__name__)

# Build the list of tools, filtering out any that failed to initialize (like Tavily without API key)
tools = [policy_rag_tool]
if tavily_tool:
    tools.append(tavily_tool)
    logger.info(f"Available tools: {[tool.name for tool in tools]}")
else:
    logger.warning("Tavily Search tool not available. Only RAG tool is active.") 