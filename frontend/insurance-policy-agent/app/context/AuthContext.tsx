"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { jwtDecode } from "jwt-decode"
import axios from "axios"

type User = {
  id: string
  email: string
  profile?: {
    first_name?: string
    last_name?: string
    phone?: string
  }
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

type RegisterData = {
  email: string
  password: string
  first_name?: string
  last_name?: string
  phone?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = "http://127.0.0.1:8000/api/auth"

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar si el usuario está autenticado al cargar la aplicación
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem("accessToken")
        if (token) {
          // Validar que el token no esté expirado
          try {
            const decoded: any = jwtDecode(token)
            const currentTime = Date.now() / 1000
            
            if (decoded.exp && decoded.exp < currentTime) {
              // Token expirado
              localStorage.removeItem("accessToken")
              localStorage.removeItem("refreshToken")
              localStorage.removeItem("user")
              setUser(null)
              setIsLoading(false)
              return
            }
            
            // Token válido, cargar datos del usuario
            const userData = JSON.parse(localStorage.getItem("user") || "{}")
            setUser(userData)
          } catch (error) {
            console.error("Error al decodificar token:", error)
            localStorage.removeItem("accessToken")
            localStorage.removeItem("refreshToken")
            localStorage.removeItem("user")
            setUser(null)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password })
      const { access_token, refresh_token, user } = response.data

      // Guardar tokens y datos de usuario en localStorage
      localStorage.setItem("accessToken", access_token)
      localStorage.setItem("refreshToken", refresh_token)
      localStorage.setItem("user", JSON.stringify(user))
      
      // Actualizar estado
      setUser(user)
      
      // Configurar axios para incluir token en todas las solicitudes
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`
      
      // Redireccionar a dashboard
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error de login:", error)
      const errorMessage = error.response?.data?.detail || "Error al iniciar sesión"
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterData) => {
    setIsLoading(true)
    try {
      const response = await axios.post(`${API_URL}/register`, userData)
      
      // El backend puede devolver un token directamente o requerir login
      if (response.data.access_token) {
        // Si el registro también hace login automático
        const { access_token, refresh_token, user } = response.data
        
        localStorage.setItem("accessToken", access_token)
        localStorage.setItem("refreshToken", refresh_token)
        localStorage.setItem("user", JSON.stringify(user))
        
        setUser(user)
        router.push("/dashboard")
      } else {
        // Si el registro es exitoso pero requiere login separado
        router.push("/login?registered=true")
      }
    } catch (error: any) {
      console.error("Error de registro:", error)
      const errorMessage = error.response?.data?.detail || "Error al registrar la cuenta"
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // Eliminar tokens y datos de usuario
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")
    
    // Eliminar token de los headers de axios
    delete axios.defaults.headers.common["Authorization"]
    
    // Actualizar estado
    setUser(null)
    
    // Redireccionar a login
    router.push("/login")
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        login, 
        register, 
        logout, 
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}