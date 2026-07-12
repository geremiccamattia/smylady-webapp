'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Instagram } from 'lucide-react'

const REFERRAL_BONUS_AMOUNT = 10 // Euro
const REFERRAL_CODE_STORAGE_KEY = 'referral_code'
const APP_STORE_URL = 'https://apps.apple.com/at/app/share-your-party/id6748308083'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.shareyourparty.app'

interface InvitePageProps {
  code: string
}

export default function InvitePage({ code }: InvitePageProps) {
  const { i18n } = useTranslation()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const isEnglish = i18n.language.startsWith('en')

  useEffect(() => {
    if (code) {
      localStorage.setItem(REFERRAL_CODE_STORAGE_KEY, code)
    }
  }, [code])

  const scrollToCta = () => {
    document.getElementById('invite-cta')?.scrollIntoView({ behavior: 'smooth' })
  }

  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  }

  const handleCTA = () => {
    if (isMobileDevice()) {
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      window.location.href = isIOS ? APP_STORE_URL : PLAY_STORE_URL
    } else {
      router.push(isEnglish ? '/en/register' : '/register')
    }
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8 space-y-4">
            <div className="text-5xl">🎉</div>
            <h1 className="text-xl font-bold">
              {isEnglish
                ? "You're already signed up!"
                : 'Du bist bereits registriert!'}
            </h1>
            <p className="text-muted-foreground">
              {isEnglish
                ? 'Share your own invite link with friends.'
                : 'Teile deinen eigenen Einladungslink mit Freunden.'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isEnglish
                ? 'Your personal invite code will soon be available in Settings.'
                : 'Deinen persönlichen Einladungscode findest du bald in den Einstellungen.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const steps = [
    {
      emoji: '📱',
      title: isEnglish ? 'Sign up' : 'Registriere dich',
      description: isEnglish
        ? 'Create your account via the app or website'
        : 'Erstelle deinen Account über die App oder Website',
    },
    {
      emoji: '📸',
      title: isEnglish ? 'Upload a profile photo' : 'Lade ein Profilfoto hoch',
      description: isEnglish
        ? 'Show the community who you are'
        : 'Zeig der Community wer du bist',
    },
    {
      emoji: '💰',
      title: isEnglish
        ? `Get €${REFERRAL_BONUS_AMOUNT} credit`
        : `${REFERRAL_BONUS_AMOUNT}€ Guthaben kassieren`,
      description: isEnglish
        ? 'For you and your friend — redeemable for tickets'
        : 'Für dich und deinen Freund — einlösbar für Tickets',
    },
  ]

  return (
    <div className="scroll-smooth">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-3xl px-6 py-16 sm:py-20 text-center text-white"
        style={{ background: 'linear-gradient(135deg, #e9548c 0%, #6c3ce9 100%)' }}
      >
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-6xl">🎉🎁💰</div>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight">
            {isEnglish ? 'Your friends invite you!' : 'Deine Freunde laden dich ein!'}
          </h1>
          <p className="text-lg sm:text-xl text-white/90">
            {isEnglish
              ? `Sign up now on Share Your Party and get €${REFERRAL_BONUS_AMOUNT} credit.`
              : `Registriere dich jetzt bei Share Your Party und sichere dir ${REFERRAL_BONUS_AMOUNT}€ Guthaben.`}
          </p>
          <Button
            size="xl"
            className="bg-white text-[#e9548c] hover:bg-white/90 rounded-full font-semibold"
            onClick={scrollToCta}
          >
            {isEnglish ? 'Sign up now' : 'Jetzt registrieren'}
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
          {isEnglish ? 'How it works' : "So funktioniert's"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <Card key={i} className="text-center">
              <CardContent className="p-6 space-y-3">
                <div
                  className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                  style={{ backgroundColor: '#e9548c1a' }}
                >
                  {step.emoji}
                </div>
                <h3 className="font-semibold text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="invite-cta" className="max-w-2xl mx-auto px-4 py-14 text-center scroll-mt-6">
        <Card className="border-2" style={{ borderColor: '#e9548c' }}>
          <CardContent className="p-8 sm:p-10 space-y-6">
            <h2 className="text-2xl font-bold">
              {isEnglish
                ? `Get your €${REFERRAL_BONUS_AMOUNT} credit now`
                : `Sichere dir jetzt deine ${REFERRAL_BONUS_AMOUNT}€ Guthaben`}
            </h2>
            <Button
              size="xl"
              variant="gradient"
              className="rounded-full font-semibold w-full sm:w-auto sm:px-16"
              onClick={handleCTA}
            >
              {isEnglish ? 'Sign up now' : 'Jetzt registrieren'}
            </Button>

            {/* App Store Badges */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={isEnglish ? '/ios-logo-en.svg' : '/ios-logo-de.svg'}
                  alt="Download on the App Store"
                  className="h-10"
                />
              </a>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={isEnglish ? '/android-logo-en.png' : '/android-logo-de.png'}
                  alt="Get it on Google Play"
                  className="h-10"
                />
              </a>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Trust */}
      <section className="max-w-2xl mx-auto px-4 pb-16 text-center space-y-3">
        <a
          href="https://www.instagram.com/shareyourparty_official"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Instagram className="h-4 w-4" />
          @shareyourparty_official
        </a>
      </section>
    </div>
  )
}
