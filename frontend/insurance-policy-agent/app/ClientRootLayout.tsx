"use client"

import { useAuth } from "@/app/context/AuthContext"
// Icons like Home, FileText, Settings, User, LogOut are no longer directly used here
// import { Home, FileText, Settings, User, LogOut } from "lucide-react"
import Link from "next/link" // Link might still be used for the logo, or can be removed if MainNav handles it
// Button is no longer directly used here unless for something else
// import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav" // Import the MainNav component

export function ClientRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated } = useAuth() // user and logout are now handled by MainNav

  return (
    <>
      {isAuthenticated && (
        <header className="border-b bg-white sticky top-0 z-10">
          <div className="container flex h-16 items-center justify-between">
            <MainNav />
          </div>
        </header>
      )}
      {children}
    </>
  )
}