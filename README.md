# Proyecto de Agente de Pólizas de Seguros AI

Este proyecto implementa un asistente AI para ayudar en la creación y gestión de pólizas de seguros. Consta de un frontend desarrollado en Next.js y un backend en FastAPI, orquestados mediante Docker Compose.

## Flujo del Agente de Pólizas AI

El flujo principal del agente es el siguiente:

1.  **Interacción del Usuario**: El usuario accede a la interfaz de creación/edición de pólizas en el frontend.
2.  **Entrada de Texto y Chat**:
    *   El usuario puede escribir directamente el contenido de la póliza en un área de texto.
    *   Paralelamente, puede interactuar con un asistente AI a través de un chat (`PolicyChat`).
3.  **Procesamiento del AI (Backend - `policy-ai/ai-service/`)**:
    *   Los mensajes del chat se envían al backend FastAPI, específicamente a la ruta definida en `app/api/internal_v1.py`.
    *   El backend utiliza un agente implementado en `app/ai/rag_agent.py`. Este agente está construido con LangGraph, cuya estructura y lógica de ejecución (nodos y bordes) se define en `app/ai/graph.py`.
    *   El agente `rag_agent.py` utiliza herramientas para responder a las consultas:
        *   `policy_rag_tool`: Realiza búsquedas semánticas en una base de conocimiento interna (vector store) para encontrar información relevante sobre pólizas.
        *   `TavilySearchResults` (web_search_tool): Realiza búsquedas en la web para obtener información actualizada, como regulaciones o conocimiento general de seguros no presente en la base interna.
    *   El agente procesa la consulta del usuario, decide qué herramienta usar (si alguna), y formula una respuesta.
4.  **Actualización de la Póliza**:
    *   Las respuestas del agente AI se devuelven al frontend.
    *   El chat muestra las respuestas del AI.
    *   El contenido de la póliza en el área de texto puede ser actualizado dinámicamente o el usuario puede copiar y pegar las sugerencias del AI.
5.  **Guardado de la Póliza**: Una vez finalizada, la póliza se guarda (el mecanismo exacto de persistencia dependerá de la implementación del backend, por ejemplo, base de datos **TBD**).

El componente `PolicyChat` en el frontend es crucial para esta interacción, manejando la comunicación con el backend para las funcionalidades del AI. La comunicación mantiene el estado de la conversación utilizando un `thread_id`.

## Integración Frontend-Backend

La comunicación entre el frontend (Next.js) y el backend (FastAPI) se realiza a través de API calls:

*   **Frontend (Next.js)**:
    *   Ubicado en el directorio `frontend/insurance-policy-agent/`.
    *   Sirve la interfaz de usuario, incluyendo la página `app/policy/create/page.tsx`.
    *   Para interactuar con el agente AI, el frontend realiza peticiones POST a su propia ruta de API: `/api/internal/answer_query`. Esta ruta está definida en `frontend/insurance-policy-agent/app/api/internal/answer_query/route.ts`.
    *   La ruta `route.ts` actúa como un proxy, reenviando la consulta del usuario (incluyendo el `query` y `thread_id`) al backend de FastAPI.

*   **Backend (FastAPI - `policy-ai/ai-service/`)**:
    *   Ubicado en el directorio `policy-ai/ai-service/`.
    *   Expone una API para que el frontend la consuma. El endpoint principal para el agente AI es `POST /api/internal/v1/answer_query`, definido en `app/api/internal_v1.py`.
    *   Este endpoint recibe la `query` y el `thread_id`, invoca a `get_agent_response` de `app/ai/rag_agent.py` y devuelve la respuesta del agente.
    *   También incluye un endpoint `POST /load-documents-from-s3` para procesar documentos desde S3 en segundo plano, gestionado por `app/services/document_processor.py`.

## Cómo Ejecutar la Aplicación con Docker Compose

Para ejecutar la aplicación completa (frontend y backend) utilizando Docker Compose, sigue estos pasos:

1.  **Prerrequisitos**:
    *   Asegúrate de tener Docker instalado y en ejecución en tu sistema.
    *   Asegúrate de tener Docker Compose instalado.

2.  **Configuración de Entorno (si es necesario)**:
    *   Puede que necesites crear un archivo `.env` en el directorio raíz del proyecto o en los directorios `frontend` y `backend` respectivamente, basándote en los archivos `.env.example` o las configuraciones especificadas en `docker-compose.yml`. Este archivo contendrá variables de entorno necesarias como claves de API, configuraciones de base de datos, etc.

3.  **Levantar los Servicios**:
    *   Abre una terminal en el directorio raíz del proyecto (donde se encuentra el archivo `docker-compose.yml`).
    *   Ejecuta el siguiente comando:
        ```bash
        docker-compose up
        ```
    *   Para ejecutar en modo detached (en segundo plano), puedes usar:
        ```bash
        docker-compose up -d
        ```

4.  **Acceder a la Aplicación**:
    *   **Frontend**: Una vez que los contenedores estén en funcionamiento, el frontend Next.js debería ser accesible en tu navegador, comúnmente en `http://localhost:3000` (verifica el `docker-compose.yml` para el mapeo de puertos exacto).
    *   **Backend**: La API de FastAPI estará disponible en otro puerto, por ejemplo, `http://localhost:8000` (también, verifica el `docker-compose.yml`).

5.  **Ver Logs (si es necesario)**:
    *   Si no estás ejecutando en modo detached, verás los logs directamente en tu terminal.
    *   Si ejecutas en modo detached, puedes ver los logs de un servicio específico con:
        ```bash
        docker-compose logs -f <nombre_del_servicio>
        ```
        (e.g., `docker-compose logs -f frontend` o `docker-compose logs -f backend`)

6.  **Detener la Aplicación**:
    *   Para detener los servicios, presiona `Ctrl+C` en la terminal donde `docker-compose up` está corriendo.
    *   Si está en modo detached, usa:
        ```bash
        docker-compose down
        ```
    *   Para detener y eliminar los volúmenes (cuidado, esto borrará datos persistidos en volúmenes Docker a menos que estén montados externamente):
        ```bash
        docker-compose down -v
        ```

Asegúrate de que el archivo `docker-compose.yml` esté correctamente configurado para construir las imágenes de tus servicios de frontend y backend, y defina las redes, puertos y volúmenes necesarios.

---

# AI Insurance Policy Agent Project (English)

This project implements an AI assistant to help create and manage insurance policies. It consists of a Next.js frontend and a FastAPI backend, orchestrated using Docker Compose.

## AI Policy Agent Flow

The main flow of the agent is as follows:

1.  **User Interaction**: The user accesses the policy creation/editing interface in the frontend.
2.  **Text Input and Chat**:
    *   The user can directly type the policy content in a text area.
    *   Concurrently, they can interact with an AI assistant via a chat interface (`PolicyChat`).
3.  **AI Processing (Backend - `policy-ai/ai-service/`)**:
    *   Chat messages are sent to the FastAPI backend, specifically to the route defined in `app/api/internal_v1.py`.
    *   The backend uses an agent implemented in `app/ai/rag_agent.py`. This agent is built with LangGraph, whose structure and execution logic (nodes and edges) are defined in `app/ai/graph.py`.
    *   The `rag_agent.py` agent uses tools to answer queries:
        *   `policy_rag_tool`: Performs semantic searches in an internal knowledge base (vector store) to find relevant policy information.
        *   `TavilySearchResults` (web_search_tool): Conducts web searches for up-to-date information, such as regulations or general insurance knowledge not present in the internal base.
    *   The agent processes the user's query, decides which tool to use (if any), and formulates a response.
4.  **Policy Update**:
    *   The AI agent's responses are returned to the frontend.
    *   The chat displays the AI's responses.
    *   The policy content in the text area can be dynamically updated, or the user can copy and paste the AI's suggestions.
5.  **Policy Saving**: Once finalized, the policy is saved (the exact persistence mechanism will depend on the backend implementation, e.g., a database **TBD**).

The `PolicyChat` component in the frontend is crucial for this interaction, handling communication with the backend for AI functionalities. Communication maintains conversation state using a `thread_id`.

## Frontend-Backend Integration

Communication between the frontend (Next.js) and backend (FastAPI) is primarily through API calls:

*   **Frontend (Next.js)**:
    *   Located in the `frontend/insurance-policy-agent/` directory.
    *   Serves the user interface, including the `app/policy/create/page.tsx` page.
    *   To interact with the AI agent, the frontend makes POST requests to its own API route: `/api/internal/answer_query`. This route is defined in `frontend/insurance-policy-agent/app/api/internal/answer_query/route.ts`.
    *   The `route.ts` file acts as a proxy, forwarding the user's query (including `query` and `thread_id`) to the FastAPI backend.

*   **Backend (FastAPI - `policy-ai/ai-service/`)**:
    *   Located in the `policy-ai/ai-service/` directory.
    *   Exposes an API for the frontend to consume. The main endpoint for the AI agent is `POST /api/internal/v1/answer_query`, defined in `app/api/internal_v1.py`.
    *   This endpoint receives the `query` and `thread_id`, invokes `get_agent_response` from `app/ai/rag_agent.py`, and returns the agent's response.
    *   It also includes a `POST /load-documents-from-s3` endpoint to process documents from S3 in the background, managed by `app/services/document_processor.py`.

## How to Run the Application with Docker Compose

To run the complete application (frontend and backend) using Docker Compose, follow these steps:

1.  **Prerequisites**:
    *   Ensure Docker is installed and running on your system.
    *   Ensure Docker Compose is installed.

2.  **Environment Configuration (if necessary)**:
    *   You may need to create a `.env` file in the project root or in the `frontend` and `backend` directories respectively, based on `.env.example` files or configurations specified in `docker-compose.yml`. This file will contain necessary environment variables such as API keys, database configurations, etc.

3.  **Start the Services**:
    *   Open a terminal in the project's root directory (where the `docker-compose.yml` file is located).
    *   Run the following command:
        ```bash
        docker-compose up
        ```
    *   To run in detached mode (in the background), you can use:
        ```bash
        docker-compose up -d
        ```

4.  **Access the Application**:
    *   **Frontend**: Once the containers are running, the Next.js frontend should be accessible in your browser, commonly at `http://localhost:3000` (check `docker-compose.yml` for the exact port mapping).
    *   **Backend**: The FastAPI API will be available on another port, e.g., `http://localhost:8000` (also, check `docker-compose.yml`).

5.  **View Logs (if necessary)**:
    *   If you are not running in detached mode, you will see the logs directly in your terminal.
    *   If running in detached mode, you can view the logs of a specific service with:
        ```bash
        docker-compose logs -f <service_name>
        ```
        (e.g., `docker-compose logs -f frontend` or `docker-compose logs -f backend`)

6.  **Stop the Application**:
    *   To stop the services, press `Ctrl+C` in the terminal where `docker-compose up` is running.
    *   If in detached mode, use:
        ```bash
        docker-compose down
        ```
    *   To stop and remove volumes (caution, this will delete data persisted in Docker volumes unless externally mounted):
        ```bash
        docker-compose down -v
        ```

Ensure that the `docker-compose.yml` file is correctly configured to build the images for your frontend and backend services, and defines the necessary networks, ports, and volumes.
