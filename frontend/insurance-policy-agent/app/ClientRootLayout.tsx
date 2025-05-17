"use client"

import { useAuth } from "@/app/context/AuthContext"
import { Home, FileText, Settings, User, LogOut } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function ClientRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout, isAuthenticated } = useAuth()

  return (
    <>
      {isAuthenticated && (
        <header className="border-b bg-white sticky top-0 z-10">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center">
                  <span className="text-white font-bold text-xs">P</span>
                </div>
                <span className="ml-2 font-semibold hidden md:inline-block">PolicyAI</span>
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link href="/dashboard" className="text-sm font-medium hover:text-black/70 flex items-center">
                  <Home className="mr-1 h-4 w-4" />
                  Dashboard
                </Link>
                <Link href="/policies" className="text-sm font-medium hover:text-black/70 flex items-center">
                  <FileText className="mr-1 h-4 w-4" />
                  Mis Pólizas
                </Link>
                <Link href="/settings" className="text-sm font-medium hover:text-black/70 flex items-center">
                  <Settings className="mr-1 h-4 w-4" />
                  Configuración
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
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
                className="hover:bg-red-50 hover:text-red-600"
                onClick={logout}
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Cerrar sesión</span>
              </Button>
            </div>
          </div>
        </header>
      )}
      {children}
    </>
  )
}