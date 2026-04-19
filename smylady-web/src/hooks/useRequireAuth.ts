import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'

export function useRequireAuth() {
  const { isAuthenticated } = useAuth()
  const { showAuthModal } = useAuthModal()

  const requireAuth = (callback: () => void) => {
    if (!isAuthenticated) {
      showAuthModal()
      return
    }
    callback()
  }

  return { requireAuth }
}
