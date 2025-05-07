"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function MainNav() {
  const pathname = usePathname()

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
        </nav>
      </div>
      <Link href="/policy/create">
        <Button className="rounded-full bg-black text-white hover:bg-black/90">NUEVA PÓLIZA</Button>
      </Link>
    </div>
  )
}
