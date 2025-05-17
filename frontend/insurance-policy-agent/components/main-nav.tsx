"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { MessageCircle, User, LogOut } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"

export function MainNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false)
  const [chatQuery, setChatQuery] = useState("")
  const { user, logout, isAuthenticated } = useAuth()

  const handleStartChat = () => {
    if (chatQuery.trim()) {
      router.push(`/chat?q=${encodeURIComponent(chatQuery)}`)
      setChatQuery("")
      setIsChatDialogOpen(false)
    }
  }

  return (
    <div className="flex justify-between items-center w-full">
      <div className="flex items-center">
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <span className="text-white font-bold text-xs">P</span>
          </div>
          <span className="font-bold text-xl">POLICYAI</span>
        </Link>
        <nav className="flex items-center space-x-8">
          <Link
            href="/dashboard"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/dashboard" ? "text-black" : "text-muted-foreground",
            )}
          >
            Pólizas
          </Link>
          <Link
            href="/policy/create"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/policy/create" ? "text-black" : "text-muted-foreground",
            )}
          >
            Crear
          </Link>
          <Link
            href="/analyze"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/analyze" ? "text-black" : "text-muted-foreground",
            )}
          >
            Analizar
          </Link>
          <Link
            href="/templates"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/templates" ? "text-black" : "text-muted-foreground",
            )}
          >
            Plantillas
          </Link>
          <Link
            href="/chat"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/chat" ? "text-black" : "text-muted-foreground",
            )}
          >
            Chat
          </Link>
        </nav>
      </div>
      <div className="flex items-center space-x-2">
        <Dialog open={isChatDialogOpen} onOpenChange={setIsChatDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MessageCircle className="h-5 w-5" />
              <span className="sr-only">Abrir chat principal</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Chat Principal</DialogTitle>
              <DialogDescription>
                Haz una pregunta o describe lo que necesitas. Te redirigiremos a una página de chat dedicada.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                id="chatQuery"
                placeholder="Ej: ¿Cómo puedo crear una póliza para mi auto?"
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleStartChat();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleStartChat} disabled={!chatQuery.trim()} className="bg-black text-white hover:bg-black/90">
                Iniciar Chat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="relative">
          <Button variant="ghost" size="sm" className="rounded-full flex items-center">
            <User className="h-5 w-5 mr-2" />
            <span className="hidden md:inline-block">
              {user?.profile?.first_name 
                ? `${user.profile.first_name}${user.profile?.last_name ? ' ' + user.profile.last_name : ''}`
                : user?.email || 'Usuario'}
            </span>
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="hover:bg-red-50 hover:text-red-600 rounded-full"
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Cerrar sesión</span>
        </Button>
        <Link href="/policy/create">
          <Button className="rounded-full bg-black text-white hover:bg-black/90">NUEVA PÓLIZA</Button>
        </Link>
      </div>
    </div>
  )
}
