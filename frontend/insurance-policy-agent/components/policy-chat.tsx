"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, User, Send, Wand2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface PolicyChatProps {
  policyTitle: string
  isNew?: boolean
  onApplyChanges?: (newContent: string) => void
  initialMessage?: string
  policyContent?: string
  documentContext?: { url: string; filename: string; }
  currentPolicyText?: string
  onPolicyTextChange?: (newText: string) => void
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function PolicyChat({ policyTitle, isNew = false, onApplyChanges, initialMessage, policyContent, documentContext, currentPolicyText, onPolicyTextChange }: PolicyChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Helper function to determine intent
  const getPolicyActionIntent = (message: string): 'generate' | 'edit' | 'qa' => {
    const lowerMessage = message.toLowerCase();

    // GENERATE INTENT: Creating a new, full policy
    // Phrases like "crear una nueva póliza", "generar un nuevo documento"
    const createNewVerbPhrases = ['crear una nueva', 'generar una nueva', 'redactar una nueva', 'hacer una nueva', 'elaborar una nueva', 'créame una nueva', 'necesito una nueva', 'quiero una nueva'];
    const policyNouns = ['póliza', 'poliza', 'documento', 'contrato']; // 'poliza' for common accent omission
    
    for (const verbPhrase of createNewVerbPhrases) {
        for (const noun of policyNouns) {
            if (lowerMessage.includes(`${verbPhrase} ${noun}`)) {
                return 'generate';
            }
        }
    }

    // Simpler phrases like "crear póliza de salud", "generar un contrato"
    // Must not contain words typically indicating modification of a part of an existing policy.
    const simpleCreateVerbs = ['crear', 'crea', 'créame', 'generar', 'genera', 'genérame', 'redactar', 'redacta', 'hacer borrador de', 'elaborar'];
    const exclusionForSimpleCreate = ['sección', 'cláusula', 'articulo', 'artículo', 'apartado', 'parte', 'modificar', 'editar', 'cambiar'];
    
    if (simpleCreateVerbs.some(v => lowerMessage.includes(v)) && 
        policyNouns.some(n => lowerMessage.includes(n)) &&
        !exclusionForSimpleCreate.some(ex => lowerMessage.includes(ex))) {
        return 'generate';
    }

    // EDIT INTENT: Modifying an existing policy (add, change, remove sections/clauses, etc.)
    const editActionKeywords = [
        'editar', 'edita', 
        'cambiar', 'cambia', 
        'modificar', 'modifica', 
        'actualizar', 'actualiza',
        'corregir', 'corrige', 
        'ajustar', 'ajusta',
        'añadir', 'añade', 'agregar', 'agrega', 'incorporar', 'incorpora', 'insertar', 'incluir',
        'eliminar', 'elimina', 'quitar', 'quita', 'remover', 'remueve',
        'revisar la póliza y', // e.g. revisar y actualizar
        'crear sección', 'crear una sección', 'generar sección', 'añadir sección', 'agregar sección', 'incluir sección',
        'crear cláusula', 'crear una cláusula', 'generar cláusula', 'añadir cláusula', 'agregar cláusula', 'incluir cláusula',
        'crear artículo', 'crear un artículo', 'añadir artículo', 'agregar artículo', 'incluir artículo',
        'crear apartado', 'crear un apartado', 'añadir apartado', 'agregar apartado', 'incluir apartado'
    ];
    const policyOrPartNounsForEdit = ['póliza', 'poliza', 'documento', 'contrato', 'sección', 'cláusula', 'artículo', 'apartado', 'párrafo', 'punto', 'elemento', 'texto', 'contenido'];

    if (editActionKeywords.some(kw => lowerMessage.includes(kw))) {
        // If it mentions a policy/document or a part of it, it's likely an edit on it.
        if (policyOrPartNounsForEdit.some(n => lowerMessage.includes(n))) {
            return 'edit';
        }
        // If no explicit policy noun but an edit verb is used with context words, assume it's an edit.
        // e.g., "añade lo siguiente:", "corrige el error"
        if (['este', 'esto', 'siguiente', 'anterior', 'error', 'detalle', 'esta parte', 'esa parte'].some(p => lowerMessage.includes(p))) {
             return 'edit';   
        }
        // If it's a short command like "edita" or "cambia" and the message is short (likely a direct command)
        if (message.trim().split(/\s+/).length <= 3 && editActionKeywords.some(kw => lowerMessage.startsWith(kw.split(' ')[0]))) {
            return 'edit';
        }
    }
    
    // Specific case: "crear/generar/redactar [una] sección/cláusula/artículo en la póliza/documento"
    const createPartVerbs = ['crear', 'generar', 'redactar', 'hacer', 'elaborar', 'desarrollar'];
    const policyParts = ['sección', 'cláusula', 'artículo', 'apartado', 'párrafo', 'punto', 'elemento', 'anexo'];
    if (createPartVerbs.some(v => lowerMessage.includes(v)) && 
        policyParts.some(p => lowerMessage.includes(p)) &&
        policyNouns.some(n => lowerMessage.includes(n))) { // e.g. "crear una sección en la póliza"
        return 'edit';
    }

    return 'qa'; // Default to question answering
  };

  const handleGeneratePolicyDraft = async (prompt: string) => {
    if (!onPolicyTextChange) {
      // This case should ideally be handled by handleSubmit, 
      // but as a safeguard, or if called directly elsewhere.
      console.warn("onPolicyTextChange is not available. Cannot generate draft.");
      setMessages((prev) => [
        ...prev,
        {
          id: `error-config-${Date.now()}`,
          role: "assistant",
          content: "Lo siento, no estoy configurado para crear pólizas en este momento.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    setIsTyping(true);
    // Add a thinking message for generation
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: `assistant-thinking-generate-${Date.now()}`,
        role: "assistant",
        content: "Entendido. Estoy generando un borrador de la póliza...",
        timestamp: new Date(),
      },
    ]);

    try {
      const response = await fetch("/api/policy/generate-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, currentPolicyText: currentPolicyText }),
      });

      // Remove the "thinking" message by filtering it out based on a unique aspect or last message if it matches
      setMessages(prev => prev.filter(msg => !(msg.role === 'assistant' && msg.content.includes('Estoy generando un borrador'))));

      if (!response.ok) {
        const errorData = await response.json();
        console.error("BFF API Error (generate-draft):", errorData);
        throw new Error(errorData.detail || errorData.error || "Policy generation failed");
      }

      const data = await response.json();
      console.log("PolicyChat: Received data from BFF for generate-draft:", data); // Log entire data object
      if (data && typeof data.draft_text === 'string') {
        console.log("PolicyChat: About to call onPolicyTextChange with draft_text:", data.draft_text); // Log the HTML
        onPolicyTextChange(data.draft_text);
      } else {
        console.error("PolicyChat: draft_text not found or not a string in BFF response:", data);
        // Optionally, inform the user or set an error message in chat
        setMessages((prev) => [
          ...prev,
          {
            id: `error-data-format-${Date.now()}`,
            role: "assistant",
            content: "Lo siento, recibí una respuesta inesperada del servidor y no pude procesar el borrador de la póliza.",
            timestamp: new Date(),
          },
        ]);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-generate-success-${Date.now()}`,
          role: "assistant",
          content: "¡Listo! He generado un borrador inicial para tu póliza. Puedes verlo y continuar editándolo en el área de texto principal.",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Failed to generate policy draft:", error);
      // Ensure "thinking" message is removed on error too
      setMessages(prev => prev.filter(msg => !(msg.role === 'assistant' && msg.content.includes('Estoy generando un borrador'))));
      let errorMessage = "Lo siento, tuve problemas al generar el borrador de la póliza.";
      if (error instanceof Error) {
        errorMessage = `Error al generar: ${error.message}`;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `error-api-generate-${Date.now()}`,
          role: "assistant",
          content: errorMessage,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEditPolicy = async (instruction: string) => {
    if (!currentPolicyText || !onPolicyTextChange) {
      console.warn("currentPolicyText or onPolicyTextChange is not available. Cannot edit policy.");
      setMessages((prev) => [
        ...prev,
        {
          id: `error-config-edit-${Date.now()}`,
          role: "assistant",
          content: "Lo siento, no estoy configurado para editar pólizas en este momento o no tengo el texto actual de la póliza.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    setIsTyping(true);
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: `assistant-thinking-edit-${Date.now()}`,
        role: "assistant",
        content: "Entendido. Estoy procesando tu solicitud de edición...",
        timestamp: new Date(),
      },
    ]);

    try {
      const response = await fetch("/api/policy/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ current_policy_text: currentPolicyText, edit_instruction: instruction }),
      });

      setMessages(prev => prev.filter(msg => !(msg.role === 'assistant' && msg.content.includes('Estoy procesando tu solicitud'))));

      if (!response.ok) {
        const errorData = await response.json();
        console.error("BFF API Error (edit-policy):", errorData);
        throw new Error(errorData.detail || errorData.error || "Policy editing failed");
      }

      const data = await response.json();
      onPolicyTextChange(data.edited_policy_text);

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-edit-success-${Date.now()}`,
          role: "assistant",
          content: "He actualizado la póliza según tus instrucciones. Revisa los cambios en el editor.",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Failed to edit policy:", error);
      setMessages(prev => prev.filter(msg => !(msg.role === 'assistant' && msg.content.includes('Estoy procesando tu solicitud'))));
      let errorMessage = "Lo siento, tuve problemas al editar la póliza.";
      if (error instanceof Error) {
        errorMessage = `Error al editar: ${error.message}`;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `error-api-edit-${Date.now()}`,
          role: "assistant",
          content: errorMessage,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    setThreadId(crypto.randomUUID())
  }, [])

  useEffect(() => {
    const canCreateOrEdit = !!onPolicyTextChange; // True if the chat is in a context where it can modify policy text

    const welcomeMessage =
      initialMessage ||
      (isNew && canCreateOrEdit
        ? `¡Hola! Soy tu asistente de pólizas. Estoy aquí para ayudarte a crear una nueva póliza de seguro personalizada. Describe el tipo de póliza que necesitas o dime qué quieres incluir para comenzar. Por ejemplo: "Crea una póliza de responsabilidad civil para una pequeña empresa" o "Redacta una póliza de hogar con cobertura para inundaciones".`
        : isNew 
          ? `¡Hola! Soy tu asistente de pólizas. ¿En qué puedo ayudarte hoy con la creación de una nueva póliza?`
          : `¡Hola! Soy tu asistente para la póliza "${policyTitle}". Puedo ayudarte a analizar, explicar o modificar esta póliza. ¿En qué puedo ayudarte hoy?`);

    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: welcomeMessage,
        timestamp: new Date(),
      },
    ])
  }, [policyTitle, isNew, initialMessage])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const callBackendAPI = async (userMessage: string) => {
    if (!threadId) {
      console.error("threadId not set")
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Lo siento, ocurrió un error de configuración. Por favor, recarga la página.",
          timestamp: new Date(),
        },
      ])
      return
    }

    setIsTyping(true)

    try {
      const requestBody: any = {
        query: userMessage,
        thread_id: threadId,
      };

      if (documentContext?.url) {
        requestBody.document_url = documentContext.url;
      }

      // Add currentPolicyText if available
      if (currentPolicyText) {
        requestBody.current_policy_text = currentPolicyText;
      }

      const response = await fetch("/api/internal/answer_query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Network response was not ok")
      }

      const data = await response.json()

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.answer || "No se recibió respuesta del asistente.",
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error("Failed to fetch from API:", error)
      let errorMessage = "Lo siento, no pude conectar con el asistente. Intenta de nuevo más tarde."
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `error-api-${Date.now()}`,
          role: "assistant",
          content: errorMessage,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    const userMessageContent = input;
    setInput("")

    const newMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessageContent,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])

    const intent = getPolicyActionIntent(userMessageContent);
    console.log("User intent detected:", intent, { hasOnPolicyTextChange: !!onPolicyTextChange, hasCurrentPolicyText: !!currentPolicyText }); // For debugging

    if (intent === 'generate' && onPolicyTextChange) {
      handleGeneratePolicyDraft(userMessageContent);
    } else if (intent === 'edit' && currentPolicyText && onPolicyTextChange) {
      handleEditPolicy(userMessageContent);
    } else {
      // Fallback to general Q&A if specific conditions aren't met or it's a QA intent
      if (intent !== 'qa' && ( (intent === 'generate' && !onPolicyTextChange) || (intent === 'edit' && (!currentPolicyText || !onPolicyTextChange)) )) {
        // If it was an edit/generate intent but couldn't be handled, inform the user.
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-capability-notice-${Date.now()}`,
            role: "assistant",
            content: "Entendido, pero no estoy configurado para realizar esa acción de edición/generación en este contexto específico. Puedo intentar responder a tu consulta de forma general.",
            timestamp: new Date(),
          },
        ]);
      }
      callBackendAPI(userMessageContent); 
    }
  }

  const handleApplyChanges = () => {
    if (onApplyChanges) {
      const exampleNewContent = `# Póliza de Seguro Actualizada

## Sección 1: Cobertura

Esta póliza cubre daños a terceros causados por las operaciones del asegurado.

**Coberturas adicionales:**
- **Cobertura por inundaciones** para instalaciones comerciales
- **Asistencia legal 24/7** para consultas relacionadas con reclamaciones

## Sección 2: Exclusiones

Esta póliza no cubre:
- Daños intencionales
- Actos de guerra o terrorismo
- Desastres naturales (excepto inundaciones según lo especificado)

## Sección 3: Límites de Cobertura

El límite máximo de cobertura es de $2,000,000 por ocurrencia.

## Sección 4: Prima y Pagos

La prima anual es de $5,500, pagadera en cuotas mensuales.`

      onApplyChanges(exampleNewContent)

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            "✅ He aplicado los cambios sugeridos a la póliza. He añadido cobertura por inundaciones y asistencia legal 24/7, y he actualizado el límite de cobertura a $2,000,000. Revisa los cambios resaltados en el documento.",
          timestamp: new Date(),
        },
      ])
    }
  }

  const renderMessageContent = (content: string) => {
    if (content.includes("[Puedo sugerir añadir cobertura")) {
      const parts = content.split("[Puedo sugerir")
      return (
        <>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              a: ({node, ...props}: any) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline" />
            }}
          >{parts[0]}</ReactMarkdown>
          <div className="mt-2">
            <Button onClick={handleApplyChanges} className="rounded-full bg-black text-white hover:bg-black/90">
              <Wand2 className="mr-2 h-4 w-4" />
              Aplicar cambios sugeridos
            </Button>
          </div>
        </>
      )
    }
    return <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      components={{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        a: ({node, ...props}: any) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline" />
      }}
    >{content}</ReactMarkdown>
  }

  return (
    <div className="bg-white rounded-3xl border h-full flex flex-col overflow-hidden">
      <div className="bg-black text-white p-4">
        <h3 className="text-lg font-medium flex items-center">
          <Bot className="mr-2 h-5 w-5" />
          Asistente de Pólizas
        </h3>
      </div>

      <ScrollArea className="flex-grow p-4 h-[600px]">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8">
                  {message.role === "assistant" ? (
                    <>
                      <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                      <AvatarFallback className="bg-black text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div>
                  <div
                    className={`rounded-3xl px-4 py-2 text-sm ${
                      message.role === "user" ? "bg-black text-white" : "bg-gray-100"
                    }`}
                  >
                    <div className="whitespace-pre-line">{renderMessageContent(message.content)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                  <AvatarFallback className="bg-black text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="rounded-3xl px-4 py-2 text-sm bg-gray-100">
                    <div className="flex space-x-1">
                      <div
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Escribe tu mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-full"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full bg-black text-white hover:bg-black/90"
            disabled={isTyping}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Enviar mensaje</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
