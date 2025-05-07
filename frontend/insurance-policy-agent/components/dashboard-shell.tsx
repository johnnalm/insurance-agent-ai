import type React from "react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 glass border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav />
          <UserNav />
        </div>
      </header>
      <main className="flex-1 container py-8 space-y-8">{children}</main>
      <footer className="py-6 border-t glass">
        <div className="container flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">© 2024 PolicyGenius AI. Todos los derechos reservados.</p>
          <p className="text-xs text-muted-foreground">
            Soluciones premium de gestión de pólizas de seguro con inteligencia artificial
          </p>
        </div>
      </footer>
    </div>
  )
}
