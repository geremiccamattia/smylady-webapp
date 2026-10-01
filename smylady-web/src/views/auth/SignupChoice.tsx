'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLocalePath } from '@/hooks/useLocalePath'
import { ArrowLeft, ArrowRight, Building2, Sparkles, User } from 'lucide-react'

/*
 * Auswahl vor der Registrierung: User, Creator oder Marke.
 *
 * Die Seite legt selbst nichts an, sie verzweigt nur — die drei Ziele sind die
 * bestehende Nutzerregistrierung, die Creator-Club-Bewerbung und die neue
 * Markenregistrierung. Kartenrahmen, Logo, Zurück-Pfeil und Gradient-Hintergrund
 * sind bewusst dieselben wie in views/auth/Register.tsx, damit der Übergang
 * nicht wie ein Seitenwechsel wirkt.
 */

interface ChoiceCard {
  id: string
  icon: typeof User
  href: string
  titleKey: string
  titleDefault: string
  descriptionKey: string
  descriptionDefault: string
}

const CHOICES: ChoiceCard[] = [
  {
    id: 'user',
    icon: User,
    href: '/register',
    titleKey: 'signupChoice.userTitle',
    titleDefault: 'Ich will Events entdecken',
    descriptionKey: 'signupChoice.userDescription',
    descriptionDefault:
      'Finde Partys, Konzerte und Workshops in deiner Nähe, sichere dir Tickets und sei mit deinen Leuten dabei.',
  },
  {
    id: 'creator',
    icon: Sparkles,
    // Die Creator-Bewerbung läuft über die bestehende Landingpage, nicht über ein
    // eigenes Formular — deshalb hier /creator-club und nicht /register/creator.
    href: '/creator-club',
    titleKey: 'signupChoice.creatorTitle',
    titleDefault: 'Ich bin Creator',
    descriptionKey: 'signupChoice.creatorDescription',
    descriptionDefault:
      'Bewirb dich für den Creator Club: exklusive Events, VIP-Zugang und faire Kooperationen.',
  },
  {
    id: 'brand',
    icon: Building2,
    href: '/register/brand',
    titleKey: 'signupChoice.brandTitle',
    titleDefault: 'Ich bin eine Marke',
    descriptionKey: 'signupChoice.brandDescription',
    descriptionDefault:
      'Lege ein Markenprofil an, veranstalte eigene Events und erreiche die Community direkt.',
  },
]

export default function SignupChoice() {
  const router = useRouter()
  const { t } = useTranslation()
  const localePath = useLocalePath()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Card className="relative w-full max-w-3xl">
        <CardHeader className="text-center">
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label={t('common.back', { defaultValue: 'Back' })}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <img
            src="/logo.png"
            alt="Share Your Party"
            className="mx-auto w-16 h-16 rounded-full object-cover mb-4"
          />
          <CardTitle className="text-2xl gradient-text">
            {t('signupChoice.title', { defaultValue: 'Wie willst du dabei sein?' })}
          </CardTitle>
          <CardDescription>
            {t('signupChoice.subtitle', {
              defaultValue: 'Wähle, was auf dich zutrifft – anpassen kannst du das später jederzeit.',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Nebeneinander ab sm, darunter gestapelt. */}
          <div className="grid gap-4 sm:grid-cols-3">
            {CHOICES.map(choice => {
              const Icon = choice.icon
              return (
                <Link
                  key={choice.id}
                  href={localePath(choice.href)}
                  className="group flex flex-col rounded-xl border p-5 text-left transition-all hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-semibold mb-1">
                    {t(choice.titleKey, { defaultValue: choice.titleDefault })}
                  </span>
                  <span className="text-sm text-muted-foreground flex-1">
                    {t(choice.descriptionKey, { defaultValue: choice.descriptionDefault })}
                  </span>
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                    {t('common.continue', { defaultValue: 'Weiter' })}
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              )
            })}
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('signupChoice.hasAccount', { defaultValue: 'Du hast schon ein Konto?' })}{' '}
            <Link href={localePath('/login')} className="text-primary hover:underline font-medium">
              {t('auth.loginNow', { defaultValue: 'Jetzt anmelden' })}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
