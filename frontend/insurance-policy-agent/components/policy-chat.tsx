"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, User, Send, Wand2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PolicyChatProps {
  policyTitle: string
  isNew?: boolean
  onApplyChanges?: (newContent: string) => void
  initialMessage?: string
  policyContent?: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function PolicyChat({ policyTitle, isNew = false, onApplyChanges, initialMessage, policyContent }: PolicyChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setThreadId(crypto.randomUUID())
  }, [])

  useEffect(() => {
    const welcomeMessage =
      initialMessage ||
      (isNew
        ? `¡Hola! Soy tu asistente de pólizas. Estoy aquí para ayudarte a crear una nueva póliza de seguro personalizada. ¿Qué tipo de cobertura estás buscando?`
        : `¡Hola! Soy tu asistente para la póliza "${policyTitle}". Puedo ayudarte a analizar, explicar o modificar esta póliza. ¿En qué puedo ayudarte hoy?`)

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
      const response = await fetch("/api/internal/answer_query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: userMessage,
          thread_id: threadId,
        }),
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

    const newMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInput("")

    callBackendAPI(input)
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
          {parts[0]}
          <div className="mt-2">
            <Button onClick={handleApplyChanges} className="rounded-full bg-black text-white hover:bg-black/90">
              <Wand2 className="mr-2 h-4 w-4" />
              Aplicar cambios sugeridos
            </Button>
          </div>
        </>
      )
    }
    return content
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
