'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LogIn, UserPlus } from 'lucide-react'

export default function ScrollSignupPrompt() {
  const { t } = useTranslation()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (isAuthenticated) return
    if (sessionStorage.getItem('scrollPromptShown')) return

    const handleScroll = () => {
      const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight
      if (scrollPercent >= 0.5) {
        setOpen(true)
        sessionStorage.setItem('scrollPromptShown', 'true')
        window.removeEventListener('scroll', handleScroll)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isAuthenticated])

  if (isAuthenticated) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center mb-4">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            {t('auth.scrollPromptTitle', { defaultValue: 'Verpasse kein Event mehr' })}
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            {t('auth.scrollPromptDesc', { defaultValue: 'Auf Share Your Party findest du Partys, Konzerte, Workshops und Business Events in deiner Nähe.' })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            variant="gradient"
            size="lg"
            className="w-full gap-2 rounded-full"
            onClick={() => {
              setOpen(false)
              router.push('/register')
            }}
          >
            <UserPlus className="h-5 w-5" />
            {t('auth.registerFree', { defaultValue: 'Kostenlos registrieren' })}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2 rounded-full"
            onClick={() => {
              setOpen(false)
              router.push('/login')
            }}
          >
            <LogIn className="h-5 w-5" />
            {t('auth.login', { defaultValue: 'Anmelden' })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
