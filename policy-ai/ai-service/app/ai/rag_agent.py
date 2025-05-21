import os
import logging
from typing import Annotated, Optional, List
import json

from bs4 import BeautifulSoup
from htmldiff2 import render_html_diff
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import BaseMessage, HumanMessage
from pydantic import BaseModel, Field

from dotenv import load_dotenv

from .graph import build_agent_executor
from app.utils.pdf_processor import download_pdf_content, extract_text_from_pdf

load_dotenv()

# Setup basic logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Print the API key for debugging
logger.info(f"OpenAI API Key Loaded: '{os.getenv('OPENAI_API_KEY')[:5]}...'") # Print first 5 chars for security

# --- LangGraph Agent Setup ---

llm = ChatOpenAI(model="gpt-4o", temperature=0, streaming=True)

# --- New Functions for Policy Generation and Editing ---

def generate_policy_draft(user_prompt: str, current_policy_text: Optional[str] = None) -> str:
    """
    Generates an initial insurance policy draft based on the user's prompt, outputting clean, well-formed HTML.
    If current_policy_text is provided, it will return a diff of the generated draft against current_policy_text.
    """
    logger.info(f"Generating policy draft (HTML) for prompt: {user_prompt[:100]}...")
    prompt_template = ChatPromptTemplate.from_messages([
        ("system",
         "You are an AI assistant helping to draft insurance policies. "
         "Based on the user\'s request, generate a comprehensive initial draft for an insurance policy strictly in well-formed HTML format. "
         "User request: '{user_request}'. "
         "Your output MUST be a single, valid HTML string, and NOTHING ELSE. "
         "Key HTML Structure Rules: "
         "1. Use standard HTML tags: <h2>, <h3>, <h4> for headings; <p> for paragraphs; <ul>, <ol>, <li> for lists; <strong> for bold; <em> for italic. "
         "2. ABSOLUTELY CRITICAL: ALL HTML tags MUST be correctly opened and closed (e.g., <h2>Title</h2>, NOT <h2>Title</h3> or <p>Text<h3>Section</h3></p>). Pay meticulous attention to heading levels and ensure they are distinct elements. "
         "3. CRITICAL: Section titles or heading-like phrases (e.g., \"Sección 1: Cobertura\") MUST be in their own dedicated heading tags (e.g., <h3>Sección 1: Cobertura</h3>). DO NOT embed section titles or other heading tags within <p> tags. Each heading must be standalone. "
         "4. Ensure text content within tags is coherent. Avoid jumbling unrelated sentences or phrases within a single tag. If content represents different ideas, use separate appropriate tags. "
         "5. STRICTLY FORBIDDEN: DO NOT include any markdown syntax (like ## or *) in the HTML output. "
         "6. STRICTLY FORBIDDEN: DO NOT include any code fence markers like ```html, ```, or any other text outside the main HTML structure. The response must start directly with the first HTML tag (e.g., <h2>) and end with the last closing tag. "
         "7. DO NOT output any explanatory text before or after the HTML. The entire response must be the HTML itself. "
         "8. VERY IMPORTANT: Ensure that distinct pieces of information are in distinct HTML elements. For example, a main title and a subtitle should be in separate tags (e.g., <h2>Main Title</h2><h4>Subtitle</h4>) OR clearly separated if in the same tag. DO NOT concatenate them like '<h2>Main TitleSubtitle</h2>'. Similarly, a paragraph must fully close before a new heading begins. Do not run paragraph text directly into a heading tag or vice-versa (e.g. AVOID: <p>end of paragraph<h3>Heading Start</h3></p> or <p>Paragraph<h3>Nested Heading</h3> Text</p>). Headings (h2, h3, h4) must always be on their own line and be distinct elements. "
         "Example of a good structure: "
         "<h2>Main Policy Title</h2>"
         "<h3>Section A Title</h3>"
         "<p>Paragraph about section A.</p>"
         "<ul><li>Item 1</li><li>Item 2</li></ul>"
         "<h3>Section B Title</h3>"
         "<p>Paragraph about section B.</p>"
         "Respond ONLY with the HTML content, starting with <h2> and ending with the final closing tag."
         ),
        ("human", "{user_request}")
    ])
    
    chain = prompt_template | llm
    try:
        response = chain.invoke({"user_request": user_prompt})
        draft_text = response.content if hasattr(response, 'content') else str(response)
        
        # Forcefully remove known problematic markers
        draft_text = draft_text.replace("```html", "").replace("```", "")
        # Attempt to strip any leading/trailing whitespace that might remain
        draft_text = draft_text.strip()

        # Clean with BeautifulSoup
        try:
            soup = BeautifulSoup(draft_text, 'html.parser')
            # Convert back to string. soup.prettify() can add newlines, 
            # and does more aggressive cleaning.
            cleaned_draft_text = soup.prettify() # Use a different variable for the cleaned version
            logger.info(f"HTML Policy draft after BeautifulSoup prettify. Length: {len(cleaned_draft_text)}")
            logger.debug(f"--- Prettified HTML Start ---\n{cleaned_draft_text}\n--- Prettified HTML End ---") # DETAILED LOGGING
        except Exception as bs_error:
            logger.error(f"BeautifulSoup cleaning error: {bs_error}", exc_info=True)
            cleaned_draft_text = draft_text # Fallback to the uncleaned (but marker-stripped) text if BS fails

        logger.info(f"HTML Policy draft generated successfully. Original Length: {len(draft_text)}, Cleaned Length: {len(cleaned_draft_text)}")

        if current_policy_text and current_policy_text.strip() != cleaned_draft_text.strip():
            logger.info("Current policy text provided, generating diff.")
            diffed_html = render_html_diff(current_policy_text, cleaned_draft_text)
            logger.info(f"Diff generated. Length: {len(diffed_html)}")
            return diffed_html
        else:
            logger.info("No current policy text or no changes, returning cleaned draft.")
            return cleaned_draft_text
    except Exception as e:
        logger.error(f"Error generating HTML policy draft: {e}", exc_info=True)
        return "<p>Error: Could not generate policy draft.</p>"

def edit_policy(current_policy_text: str, edit_instruction: str) -> str:
    """
    Edits an existing insurance policy (in HTML format) based on the user's instruction, 
    returning an HTML diff of the changes.
    """
    logger.info(f"Editing HTML policy based on instruction: {edit_instruction[:100]}...")
    prompt_template = ChatPromptTemplate.from_messages([
        ("system",
         "You are an AI assistant helping to edit an existing insurance policy, which is provided in HTML format. "
         "The user wants to make the following change: '{edit_instruction}'. "
         "Apply this change to the provided HTML policy text. "
         "Your output MUST be a single, valid HTML string representing the FULL modified policy. "
         "Key HTML Structure Rules for Editing: "
         "1. CRITICAL: ALL HTML tags (both existing and new) MUST be correctly opened and closed (e.g., <p>Text</p>). "
         "2. Preserve the existing HTML structure as much as possible. Only change what is necessary based on the edit instruction. "
         "3. If adding new section titles or heading-like phrases, they MUST be in their own heading tags (e.g., <h3>New Section</h3>). DO NOT put new section titles inside <p> tags. "
         "4. Ensure text content within tags is coherent. "
         "5. DO NOT introduce any markdown syntax (like ## or *) in the HTML output. "
         "6. DO NOT include any ```html ... ``` markers or any text outside the main HTML structure. "
         "Respond ONLY with the full modified HTML content. "
         "\\n\\nExisting Policy (HTML):\\n{policy_text}"),
        ("human", "Please apply the edit: '{edit_instruction}' to the HTML policy provided in the system message.")
    ])

    chain = prompt_template | llm
    try:
        response = chain.invoke({
            "policy_text": current_policy_text,
            "edit_instruction": edit_instruction
        })
        edited_text_raw = response.content if hasattr(response, 'content') else str(response)
        logger.info(f"Raw edited HTML policy received from LLM. Length: {len(edited_text_raw)}")

        # Clean with BeautifulSoup before diffing
        try:
            soup = BeautifulSoup(edited_text_raw, 'html.parser')
            cleaned_edited_text = soup.prettify()
            logger.info(f"Cleaned edited HTML with BeautifulSoup. Length: {len(cleaned_edited_text)}")
        except Exception as bs_error:
            logger.error(f"BeautifulSoup cleaning error on edited text: {bs_error}", exc_info=True)
            cleaned_edited_text = edited_text_raw # Fallback

        # Compute the diff
        diffed_html = render_html_diff(current_policy_text, cleaned_edited_text)
        logger.info(f"Diff generated for edited policy. Length: {len(diffed_html)}")
        return diffed_html
    except Exception as e:
        logger.error(f"Error editing HTML policy or generating diff: {e}", exc_info=True)
        return "<p>Error: Could not edit policy or generate diff.</p>"

# --- Define structured output model ---
class PolicyAnalysisOutput(BaseModel):
    score: int = Field(..., description="Un número entero entre 0 y 100 representando la calidad general de la póliza")
    strengths: List[str] = Field(..., description="Una lista de fortalezas clave de la póliza")
    weaknesses: List[str] = Field(..., description="Una lista de debilidades clave o áreas de mejora de la póliza")
    recommendations: List[str] = Field(..., description="Una lista de recomendaciones concretas para el titular de la póliza")

# --- Build Agent Executor ---
agent_executor = None
if llm:
    try:
        agent_executor = build_agent_executor(llm)
    except Exception as e:
        logger.error(f"Agent executor could not be built from rag_agent.py (relying on graph.py): {e}", exc_info=True)
else:
    logger.error("LLM not available, cannot build agent executor.")

# --- Main Function to Interact with Agent ---

ANALYSIS_QUERY_TEXT = "Analiza esta póliza, detallando fortalezas, debilidades y recomendaciones."

def get_agent_response(query: str, current_policy_text: Optional[str] = None, config: dict = None) -> str:
    """
    Gets a response from the LangGraph agent for the given query.
    If the query is the specific analysis query with a document_url,
    it returns a structured JSON analysis. Otherwise, it uses the conversational agent.
    Optionally, current_policy_text can be provided to give context to the agent.
    """
    if not agent_executor and query != ANALYSIS_QUERY_TEXT:
        if query != ANALYSIS_QUERY_TEXT: # Allow analysis query even if main agent fails, but log
             logger.error("Agent executor is not available for conversational query.")
             raise Exception("LangGraph agent executor not initialized or failed to build.")
        # If it is the analysis query, we can proceed as it uses a direct LLM call, not the agent_executor.

    if not query:
        return json.dumps({
            "score": 0, "strengths": [], "weaknesses": ["Error: No se proporcionó ninguna consulta."], "recommendations": []
        })

    if config is None:
        config = {}
    
    # Ensure 'configurable' and 'thread_id' are initialized in config
    config.setdefault("configurable", {}).setdefault("thread_id", "default_thread")
    if config["configurable"]["thread_id"] == "default_thread":
        logger.warning(f"Using default thread_id for conversational agent: {config['configurable']['thread_id']}")
    
    if query == ANALYSIS_QUERY_TEXT and "document_context" in config and "url" in config["document_context"]:
        doc_url = config["document_context"]["url"]
        logger.info(f"Performing structured analysis for query: '{query}' on document: {doc_url}")

        try:
            pdf_bytes = download_pdf_content(doc_url)
            if not pdf_bytes:
                logger.error(f"Failed to download PDF for analysis: {doc_url}")
                return json.dumps({
                    "score": 0, "strengths": [],
                    "weaknesses": ["Error: No se pudo descargar el documento PDF para el análisis."],
                    "recommendations": ["Por favor, verifique la URL del documento o la conexión de red."]
                })

            text_content = extract_text_from_pdf(pdf_bytes)
            if not text_content:
                logger.error(f"Failed to extract text for analysis from PDF: {doc_url}")
                return json.dumps({
                    "score": 0, "strengths": [],
                    "weaknesses": ["Error: No se pudo extraer texto del documento PDF. Puede estar vacío o corrupto."],
                    "recommendations": ["Por favor, intente con otro documento."]
                })

            system_prompt_template = """
            Eres un experto analista de pólizas de seguros. Analiza el siguiente texto de una póliza de seguro.
            Debes generar una respuesta JSON con la siguiente estructura:
            {{
              "score": <un número entero entre 0 y 100 representando la calidad general de la póliza>,
              "strengths": ["<una lista de fortalezas clave de la póliza>"],
              "weaknesses": ["<una lista de debilidades clave o áreas de mejora de la póliza>"],
              "recommendations": ["<una lista de recomendaciones concretas para el titular de la póliza>"]
            }}
            Asegúrate de que la salida sea únicamente un objeto JSON válido y nada más.
            No incluyas explicaciones adicionales fuera del JSON.
            Calcula el 'score' basándote en tu análisis general de las fortalezas y debilidades.
            El idioma de las fortalezas, debilidades y recomendaciones debe ser español.
            """
            
            human_prompt_template = "Texto de la póliza para analizar:\n\n{policy_text}"

            prompt = ChatPromptTemplate.from_messages([
                ("system", system_prompt_template),
                ("human", human_prompt_template)
            ])
            
            structured_llm = ChatOpenAI(model="gpt-4o", temperature=0.1).with_structured_output(PolicyAnalysisOutput)
            
            chain = prompt | structured_llm
            analysis_result_pydantic = chain.invoke({"policy_text": text_content[:16000]})

            json_response_str = analysis_result_pydantic.model_dump_json()
            logger.info(f"Structured analysis JSON response generated: {json_response_str[:200]}...")
            return json_response_str

        except Exception as e:
            logger.error(f"Error generating structured JSON analysis: {e}", exc_info=True)
            return json.dumps({
                "score": 0, "strengths": [],
                "weaknesses": ["Error: Ocurrió un error interno al generar el análisis estructurado."],
                "recommendations": ["Por favor, inténtelo de nuevo más tarde o contacte a soporte si el problema persiste."]
            })
    
    # Fallback to conversational agent for all other queries or if analysis conditions not met
    if not agent_executor:
        logger.error("Agent executor is not available for conversational query after analysis attempt.")
        return "Error: El agente de conversación no está disponible."

    actual_query_for_agent = query
    document_context_info = ""

    # Specific Document Q&A (via URL) takes precedence
    if "document_context" in config and "url" in config["document_context"] and not (query == ANALYSIS_QUERY_TEXT): # analysis query handled above
        doc_url = config["document_context"]["url"]
        actual_query_for_agent = (
            f"The user's query is: '{query}'.\\n"
            f"A specific document is available for context at URL: '{doc_url}'.\\n"
            f"To answer this query, you MUST use the 'specific_document_qa_tool'.\\n"
            f"When calling 'specific_document_qa_tool', you MUST provide two arguments:\\n"
            f"1. 'query': Set this to the user's original query, which is: '{query}'.\\n"
            f"2. 'document_url': Set this to the document URL, which is: '{doc_url}'.\\n"
            f"Ensure your tool call to 'specific_document_qa_tool' includes both these arguments with these exact values. Do not use any other tool if this document URL is present."
        )
        document_context_info = f" with document_url: {doc_url}"
        logger.info(f"Conversational agent will be invoked with a highly directive query for specific_document_qa_tool. User query: '{query}', Doc URL: {doc_url}")
    # General query with current_policy_text context
    elif current_policy_text and not (query == ANALYSIS_QUERY_TEXT and "document_context" in config): # Exclude analysis query which has its own context handling
        actual_query_for_agent = (
            f"The user's query is: '{query}'.\\n"
            f"They are currently working on the following insurance policy document. Use this document as the primary context for your response:\\n"
            f"--- POLICY DOCUMENT START ---\\n{current_policy_text}\\n--- POLICY DOCUMENT END ---\\n"
            f"Please respond to the user's query based on this context. If the query is a request for modification, explain what you would change or provide the change directly. If it's a question, answer it based on the document."
        )
        document_context_info = " with current policy text context"
        logger.info(f"Conversational agent will be invoked with user query AND current policy context. Query: '{query}'")
    # General query without specific document or policy text context
    else:
        logger.info(f"Conversational agent will be invoked for a general query (no specific document_url or policy_text). User query: '{query}'")
    
    logger.info(f"Invoking conversational agent. Effective query for agent: '{actual_query_for_agent[:500]}...'{document_context_info}, Config: {config}")

    try:
        final_state = agent_executor.invoke(
            {"messages": [HumanMessage(content=actual_query_for_agent)]}, 
            config=config
        )

        final_response_message = None
        if final_state and 'messages' in final_state:
             for msg in reversed(final_state['messages']):
                 if isinstance(msg, BaseMessage) and msg.type == "ai" and not getattr(msg, 'tool_calls', None):
                     final_response_message = msg
                     break

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
# Ensure necessary packages (langgraph, langchain-openai, langchain-community, tavily-python, python-dotenv, pydantic) are installed.
