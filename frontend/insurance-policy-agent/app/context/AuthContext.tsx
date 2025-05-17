"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { jwtDecode } from "jwt-decode"
import axios from "axios"

type User = {
  id: string // Asegúrate que esto coincida con user_id del backend
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

// Ya no necesitamos la URL completa del backend aquí, llamaremos a las API Routes locales de Next.js
const API_AUTH_PREFIX = "/api/auth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("accessToken")
        if (token) {
          try {
            const decoded: any = jwtDecode(token)
            const currentTime = Date.now() / 1000
            
            if (decoded.exp && decoded.exp < currentTime) {
              localStorage.removeItem("accessToken")
              localStorage.removeItem("refreshToken")
              localStorage.removeItem("user")
              setUser(null)
              return
            }
            
            const userDataString = localStorage.getItem("user");
            if (userDataString) {
                const storedUser = JSON.parse(userDataString);
                // Asegúrate que el user almacenado en localStorage tenga 'id' y no 'user_id'
                // o ajusta aquí para que coincida con la estructura de User type
                setUser({
                    id: storedUser.user_id || storedUser.id, // Adaptar según lo que guardes
                    email: storedUser.email,
                    profile: storedUser.profile
                });
            } else {
                setUser(null); // No hay datos de usuario
            }
          } catch (error) {
            console.error("Error al decodificar token o parsear usuario:", error)
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
      // Llama a la API Route local de Next.js
      const response = await axios.post(`${API_AUTH_PREFIX}/login`, { email, password })
      // La respuesta de la API Route de Next.js debería ser idéntica a la del backend de FastAPI
      const { access_token, refresh_token, user: backendUser } = response.data

      localStorage.setItem("accessToken", access_token)
      localStorage.setItem("refreshToken", refresh_token)
      // Asegúrate que la estructura de 'backendUser' coincida con tu tipo 'User'
      // Especialmente el campo 'id' vs 'user_id'
      const appUser: User = {
        id: backendUser.user_id || backendUser.id, // o como venga del backend
        email: backendUser.email,
        profile: backendUser.profile
      };
      localStorage.setItem("user", JSON.stringify(appUser))
      
      setUser(appUser)
      
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`
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
      // Llama a la API Route local de Next.js
      const response = await axios.post(`${API_AUTH_PREFIX}/register`, userData)
      
      if (response.data.access_token && response.data.user) {
        const { access_token, refresh_token, user: backendUser } = response.data
        
        localStorage.setItem("accessToken", access_token)
        localStorage.setItem("refreshToken", refresh_token)
        const appUser: User = {
            id: backendUser.user_id || backendUser.id,
            email: backendUser.email,
            profile: backendUser.profile
        };
        localStorage.setItem("user", JSON.stringify(appUser))
        
        setUser(appUser)
        router.push("/dashboard")
      } else {
        // Si el registro es exitoso pero requiere login separado (el backend de FastAPI
        // devuelve el user_id y email, que la API route de Next.js reenvía)
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
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")
    delete axios.defaults.headers.common["Authorization"]
    setUser(null)
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