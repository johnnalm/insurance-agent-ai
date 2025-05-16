import type React from "react"
import type { Metadata } from "next"
import { AuthProvider } from "@/app/context/AuthContext"
import "./globals.css"
import { ClientRootLayout } from "./ClientRootLayout"

export const metadata: Metadata = {
  title: "PolicyAI - Gestión inteligente de pólizas de seguro",
  description: "Plataforma de gestión de pólizas de seguro con inteligencia artificial",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <ClientRootLayout>
            {children}
          </ClientRootLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
