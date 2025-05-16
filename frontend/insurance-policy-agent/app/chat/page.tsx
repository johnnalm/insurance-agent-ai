"use client"

import MainChat from "@/components/main-chat"
import { Suspense } from 'react';
import ProtectedRoute from "../components/ProtectedRoute";

// A simple loader component
function ChatPageLoader() {
  return (
    <div className="container mx-auto py-10 h-full flex flex-col items-center justify-center">
      <p className="text-lg text-muted-foreground">Cargando chat...</p>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
    // Wrap MainChat with Suspense for useSearchParams
    <Suspense fallback={<ChatPageLoader />}>
      <div className="container mx-auto py-10 h-full flex flex-col">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Chat Principal</h1>
        <p className="text-muted-foreground mb-8">
          Aquí puedes conversar con el asistente AI sobre cualquier tema.
        </p>
        <div className="flex-grow min-h-0"> {/* Ensure flex-grow takes remaining space and min-h-0 allows shrinking */}
          <MainChat />
        </div>
      </div>
    </Suspense>
    </ProtectedRoute>
  )
} 