"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, User, Send } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface MainChatProps {
  // We might add specific props later if needed
}

export default function MainChat({}: MainChatProps) {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q")

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
    const welcomeMessageContent = "¡Hola! Soy tu asistente AI. ¿En qué puedo ayudarte hoy?"
    let initialMessages: Message[] = [
      {
        id: "welcome",
        role: "assistant",
        content: welcomeMessageContent,
        timestamp: new Date(),
      },
    ]

    if (initialQuery) {
      const userQueryMessage: Message = {
        id: `user-initial-${Date.now()}`,
        role: "user",
        content: initialQuery,
        timestamp: new Date(),
      }
      initialMessages.push(userQueryMessage)
      // Automatically call backend with the initial query
      callBackendAPI(initialQuery, crypto.randomUUID()) // Pass a new threadId for the initial query
    }
    setMessages(initialMessages)
  }, [initialQuery]) // Rerun when initialQuery changes

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  // The callBackendAPI function needs a unique thread_id for each conversation.
  // If an initialQuery is present, we start a new conversation.
  // For subsequent messages, we use the threadId established for this chat session.
  const callBackendAPI = async (userMessage: string, currentThreadId: string | null) => {
    if (!currentThreadId) {
      console.error("threadId not set for API call")
      setMessages((prev) => [
        ...prev,
        {
          id: `error-config-${Date.now()}`,
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
          thread_id: currentThreadId, // Use the passed thread_id
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
    
    // Ensure threadId is initialized before calling API
    let currentThreadId = threadId;
    if (!currentThreadId) {
        const newThreadId = crypto.randomUUID();
        setThreadId(newThreadId);
        currentThreadId = newThreadId;
    }

    callBackendAPI(input, currentThreadId)
    setInput("")
  }

  return (
    <div className="bg-white rounded-3xl border h-full flex flex-col overflow-hidden shadow-xl">
      <div className="bg-black text-white p-4">
        <h3 className="text-lg font-medium flex items-center">
          <Bot className="mr-2 h-5 w-5" />
          Asistente Principal
        </h3>
      </div>

      <ScrollArea className="flex-grow p-4 h-[calc(100vh-250px)]"> {/* Adjusted height */}
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
                    className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      message.role === "user" ? "bg-black text-white" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div className="whitespace-pre-line"><ReactMarkdown
remarkPlugins={[remarkGfm]}
components={{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  a: ({node, ...props}: any) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline" />
}}
                    >{message.content}</ReactMarkdown></div>
                  </div>
                  <div className={`text-xs text-muted-foreground mt-1.5 ${message.role === "user" ? "text-right" : "text-left"}`}>
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
                  <div className="rounded-2xl px-4 py-2.5 text-sm bg-gray-100">
                    <div className="flex space-x-1.5">
                      <div
                        className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
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

      <div className="p-4 border-t bg-white">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Escribe tu mensaje al Asistente Principal..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-full h-12 px-5 focus-visible:ring-black"
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full bg-black text-white hover:bg-black/90 w-12 h-12"
            disabled={isTyping || !input.trim()}
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Enviar mensaje</span>
          </Button>
        </form>
      </div>
    </div>
  )
} 