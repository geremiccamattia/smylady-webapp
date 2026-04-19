import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/types'
import { authService } from '@/services/auth'
import { STORAGE_KEYS } from '@/lib/constants'

interface LoginWithCredentials {
  (email: string, password: string): Promise<void>
}

interface LoginWithResponse {
  (response: { token: string; user: User }): Promise<void>
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: LoginWithCredentials & LoginWithResponse
  register: (name: string, email: string, password: string, dateOfBirth: string) => Promise<unknown>
  logout: () => void
  updateUser: (user: User) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER)
        
        if (storedToken) {
          setToken(storedToken)
          
          // Try to parse stored user
          if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
            try {
              const parsedUser = JSON.parse(storedUser)
              // Check for _id OR id (backend may return either)
              if (parsedUser && (parsedUser._id || parsedUser.id)) {
                setUser(parsedUser)
              } else {
                // Invalid user data - fetch from API
                const freshUser = await authService.getCurrentUser()
                setUser(freshUser)
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(freshUser))
              }
            } catch {
              // Parse failed - fetch from API
              const freshUser = await authService.getCurrentUser()
              setUser(freshUser)
              localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(freshUser))
            }
          } else {
            // No stored user - fetch from API
            const freshUser = await authService.getCurrentUser()
            setUser(freshUser)
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(freshUser))
          }
        }
      } catch (e) {
        // Token invalid or API error - clear everything
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
        setToken(null)
        setUser(null)
      }
      setIsLoading(false)
    }
    
    initAuth()
  }, [])

  // Login can be called with credentials or with auth response (for OTP flow)
  // Overloaded to accept (email, password) or ({ token, user })
  const login = async (emailOrUsernameOrResponse: string | { token: string; user: User }, password?: string): Promise<void> => {
    let authToken: string
    let authUser: User

    if (typeof emailOrUsernameOrResponse === 'object') {
      // Direct login with auth response (from OTP verification)
      const response = emailOrUsernameOrResponse
      authToken = response.token
      authUser = response.user
    } else {
      // Login with credentials
      const response = await authService.login({ emailOrUsername: emailOrUsernameOrResponse, password: password! })
      authToken = response.token
      authUser = response.user
    }

    // Set token and initial user data immediately so UI updates right away
    setToken(authToken)
    setUser(authUser)
    localStorage.setItem(STORAGE_KEYS.TOKEN, authToken)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authUser))

    // Fetch the complete user profile (with profileImage etc.) in background
    // The login response may not include all fields
    try {
      const freshUser = await authService.getCurrentUser()
      if (freshUser) {
        setUser(freshUser)
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(freshUser))
      }
    } catch (e) {
      // Not critical - we already have the basic user data from login response
      console.warn('Could not fetch full profile after login:', e)
    }
  }

  const register = async (name: string, email: string, password: string, dateOfBirth: string) => {
    const response = await authService.register({ name, email, password, dateOfBirth })
    // After registration, user needs to verify OTP
    // Don't set token here - redirect to OTP screen
    return response
  }

  const logout = () => {
    authService.logout()
    setToken(null)
    setUser(null)
    window.location.href = '/explore'
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser))
  }

  const refreshUser = async () => {
    try {
      const freshUser = await authService.getCurrentUser()
      setUser(freshUser)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(freshUser))
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
