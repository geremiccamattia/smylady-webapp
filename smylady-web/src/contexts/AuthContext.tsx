'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/types'
import { authService } from '@/services/auth'
import { STORAGE_KEYS } from '@/lib/constants'
import { navigateToPath } from '@/lib/navigation'
import { toLoginSession, type LoginResponseLike } from '@/lib/loginResponse'

interface LoginWithCredentials {
  (email: string, password: string): Promise<void>
}

interface LoginWithResponse {
  (response: LoginResponseLike): Promise<void>
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: LoginWithCredentials & LoginWithResponse
  register: (name: string, email: string, password: string, dateOfBirth: string, referralCode?: string) => Promise<unknown>
  logout: () => void
  updateUser: (user: User) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/*
 * Datenminimierung (M6): Im localStorage steht nur noch, was ohne Server
 * gebraucht wird — die ID (Socket-Verbindung, siehe services/socket.ts),
 * Rolle und Name. E-Mail, Geburtsdatum, Standort usw. bleiben im Speicher
 * (Context) und kommen bei jedem Start frisch aus GET /users/me.
 */
type StoredUser = Pick<User, 'id' | '_id' | 'role' | 'name'>

function persistUser(u: User | null | undefined): void {
  if (!u) return
  const minimal: StoredUser = { id: u.id, _id: u._id, role: u.role, name: u.name }
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(minimal))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    /*
     * Kennzeichen wie isBrand oder isCreator setzt der Admin serverseitig
     * (Freischaltung), ohne dass sich der Nutzer neu anmeldet (Testlauf-
     * Schritt A8) — darum kommt der User beim Start immer frisch aus
     * /users/me. Ein 401 landet im Interceptor (lib/api.ts), der abmeldet.
     */
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER)

        if (storedToken) {
          setToken(storedToken)

          let parsedUser: User | null = null
          if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
            try {
              parsedUser = JSON.parse(storedUser)
            } catch {
              parsedUser = null
            }
          }

          // Check for _id OR id (backend may return either)
          if (parsedUser && (parsedUser._id || parsedUser.id)) {
            /*
             * Der Cache enthält seit M6 nur noch id/role/name. Seiten, die beim
             * ersten Rendern Felder wie E-Mail oder Bio übernehmen, brauchen den
             * vollständigen User — deshalb hier auf /users/me warten. Scheitert
             * der Abruf (offline), bleibt der Minimal-Cache, damit die Sitzung
             * nicht verloren geht; ein 401 meldet der Interceptor ohnehin ab.
             */
            try {
              const freshUser = await authService.getCurrentUser()
              if (freshUser && (freshUser._id || freshUser.id)) {
                setUser(freshUser)
                persistUser(freshUser)
              } else {
                setUser(parsedUser)
              }
            } catch {
              setUser(parsedUser)
            }
          } else {
            // No/invalid stored user - fetch from API
            const freshUser = await authService.getCurrentUser()
            setUser(freshUser)
            persistUser(freshUser)
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
  const login = async (
    emailOrUsernameOrResponse: string | LoginResponseLike,
    password?: string,
  ): Promise<void> => {
    // Direkt mit der Antwort (OTP, Social-Login) oder mit Zugangsdaten.
    // Flache und verschachtelte Antwort gelten beide, siehe lib/loginResponse.ts.
    const response =
      typeof emailOrUsernameOrResponse === 'object'
        ? emailOrUsernameOrResponse
        : await authService.login({ emailOrUsername: emailOrUsernameOrResponse, password: password! })
    const { token: authToken, user: authUser } = toLoginSession(response)

    // Set token and initial user data immediately so UI updates right away
    setToken(authToken)
    setUser(authUser)
    localStorage.setItem(STORAGE_KEYS.TOKEN, authToken)
    persistUser(authUser)

    // Fetch the complete user profile (with profileImage etc.) in background
    // The login response may not include all fields
    try {
      const freshUser = await authService.getCurrentUser()
      if (freshUser) {
        setUser(freshUser)
        persistUser(freshUser)
      }
    } catch (e) {
      // Not critical - we already have the basic user data from login response
      console.warn('Could not fetch full profile after login:', e)
    }
  }

  const register = async (name: string, email: string, password: string, dateOfBirth: string, referralCode?: string) => {
    const response = await authService.register({ name, email, password, dateOfBirth, referralCode })
    // After registration, user needs to verify OTP
    // Don't set token here - redirect to OTP screen
    return response
  }

  const logout = () => {
    authService.logout()
    setToken(null)
    setUser(null)
    navigateToPath('/explore')
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    persistUser(updatedUser)
  }

  const refreshUser = async () => {
    try {
      const freshUser = await authService.getCurrentUser()
      setUser(freshUser)
      persistUser(freshUser)
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
