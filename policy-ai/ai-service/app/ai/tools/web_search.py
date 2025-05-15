import logging
from langchain_community.tools.tavily_search import TavilySearchResults
import os

logger = logging.getLogger(__name__)

# Requires TAVILY_API_KEY environment variable
# Ensure tavily-python is installed: pip install tavily-python
tavily_tool = None
try:
    if os.getenv("TAVILY_API_KEY"):
        tavily_tool = TavilySearchResults(max_results=3)
        tavily_tool.name = "web_search_tool"
        tavily_tool.description = "Searches the web for information. Use this for general knowledge questions, current events, or regulations not covered by internal documents or a specific provided policy document."
        logger.info("Tavily Search tool initialized successfully.")
    else:
        logger.warning("TAVILY_API_KEY not found in environment. Tavily Search tool is disabled.")
except Exception as e:
    logger.error(f"Failed to initialize Tavily Search tool: {e}", exc_info=True)
    tavily_tool = None # Ensure it's None if initialization fails 