"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import PublicRoute from "@/app/components/PublicRoute"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    phone: ""
  })
  const [error, setError] = useState<string | null>(null)
  const { register, isLoading } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name || undefined,
        last_name: formData.last_name || undefined,
        phone: formData.phone || undefined
      })
      // La redirección se maneja en el contexto de autenticación
    } catch (error: any) {
      setError(error.message)
    }
  }

  return (
    <PublicRoute>
      <div className="min-h-screen flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
            </div>
            <h1 className="mt-6 text-3xl font-bold">Crear Cuenta</h1>
            <p className="mt-2 text-sm text-gray-600">
              Regístrate para comenzar a administrar tus pólizas
            </p>
          </div>

          {error && (
            <Alert className="bg-red-50 text-red-800 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium">
                  Correo Electrónico *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1"
                  placeholder="ejemplo@correo.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="block text-sm font-medium">
                    Nombre
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    autoComplete="given-name"
                    className="mt-1"
                    placeholder="Nombre"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="block text-sm font-medium">
                    Apellido
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    autoComplete="family-name"
                    className="mt-1"
                    placeholder="Apellido"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="phone" className="block text-sm font-medium">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className="mt-1"
                  placeholder="+34600123456"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="block text-sm font-medium">
                  Contraseña *
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 8 caracteres
                </p>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword" className="block text-sm font-medium">
                  Confirmar Contraseña *
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-black text-white rounded-full hover:bg-black/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Registrarse"
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="font-medium text-black hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PublicRoute>
  )
}