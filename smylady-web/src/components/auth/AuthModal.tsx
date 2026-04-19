import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LogIn, UserPlus } from 'lucide-react'

export default function AuthModal() {
  const { isAuthModalVisible, hideAuthModal } = useAuthModal()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Dialog open={isAuthModalVisible} onOpenChange={hideAuthModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center mb-4">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            Anmeldung erforderlich
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Um diese Aktion durchzuführen, musst du eingeloggt sein.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            variant="gradient"
            size="lg"
            className="w-full gap-2 rounded-full"
            onClick={() => {
              hideAuthModal()
              navigate('/register', { state: { from: location } })
            }}
          >
            <UserPlus className="h-5 w-5" />
            Kostenlos registrieren
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2 rounded-full"
            onClick={() => {
              hideAuthModal()
              navigate('/login', { state: { from: location } })
            }}
          >
            <LogIn className="h-5 w-5" />
            Anmelden
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
