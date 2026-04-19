import { createContext, useContext, useState, ReactNode } from 'react'

interface AuthModalContextType {
  showAuthModal: () => void
  hideAuthModal: () => void
  isAuthModalVisible: boolean
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false)

  return (
    <AuthModalContext.Provider value={{
      showAuthModal: () => setIsAuthModalVisible(true),
      hideAuthModal: () => setIsAuthModalVisible(false),
      isAuthModalVisible,
    }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (!context) throw new Error('useAuthModal must be used within AuthModalProvider')
  return context
}
