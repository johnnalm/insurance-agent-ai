import logging
from .rag_tool import policy_rag_tool
from .web_search import tavily_tool
from .specific_doc_qa import specific_document_qa_tool

logger = logging.getLogger(__name__)

# Build the list of tools, filtering out any that failed to initialize
tools = [] # Start with an empty list

# Add tools if they are available
if policy_rag_tool:
    tools.append(policy_rag_tool)
if specific_document_qa_tool:
    tools.append(specific_document_qa_tool)
if tavily_tool:
    tools.append(tavily_tool)

if tools:
    logger.info(f"Available tools: {[tool.name for tool in tools]}")
else:
    logger.warning("No tools are available. All tool initializations might have failed or they are not defined.")

# Fallback message if some tools are missing, for more granular logging
if not policy_rag_tool:
    logger.warning("General RAG tool (policy_rag_tool) is not available.")
if not specific_document_qa_tool:
    logger.warning("Specific Document QA tool (specific_document_qa_tool) is not available.")
if not tavily_tool:
    logger.warning("Tavily Search tool (web_search_tool) is not available.") 