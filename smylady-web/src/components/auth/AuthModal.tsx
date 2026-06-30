'use client'

import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LogIn, UserPlus } from 'lucide-react'

export default function AuthModal() {
  const { isAuthModalVisible, hideAuthModal } = useAuthModal()
  const router = useRouter()
  const { t, i18n } = useTranslation()
  console.log('[AuthModal] current language:', i18n.language)

  return (
    <Dialog open={isAuthModalVisible} onOpenChange={hideAuthModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center mb-4">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            {t('auth.loginRequired', { defaultValue: 'Anmeldung erforderlich' })}
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            {t('auth.loginRequiredDesc', { defaultValue: 'Um diese Aktion durchzuführen, musst du eingeloggt sein.' })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            variant="gradient"
            size="lg"
            className="w-full gap-2 rounded-full"
            onClick={() => {
              hideAuthModal()
              router.push('/register')
            }}
          >
            <UserPlus className="h-5 w-5" />
            {t('auth.registerFree', { defaultValue: 'Kostenlos dabei sein' })}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2 rounded-full"
            onClick={() => {
              hideAuthModal()
              router.push('/login')
            }}
          >
            <LogIn className="h-5 w-5" />
            {t('auth.login')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
