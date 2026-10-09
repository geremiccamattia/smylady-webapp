'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Clock, Check, Sparkles, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useLocalePath } from '@/hooks/useLocalePath'
import { creatorService, resolveCreatorStanding } from '@/services/creator'
import CreatorApplicationForm from '@/components/creator/CreatorApplicationForm'

/*
 * Bewerbung für den Creator Club, für bereits angemeldete Nutzer.
 *
 * Der Einstieg für neue Nutzer läuft über die Registrierung (Checkbox dort).
 * Diese Seite deckt alle anderen Fälle ab: Wer schon ein Konto hat, wer die
 * Bewerbung in der Registrierung übersprungen hat, und wer nach dem Stand
 * seiner Bewerbung sehen will.
 */

/** Die Ansicht, die sich aus der Serverantwort ergibt. */
type View = 'loading' | 'form' | 'pending' | 'approved' | 'rejected' | 'member' | 'error'

export default function CreatorApply() {
  const { t } = useTranslation()
  const localePath = useLocalePath()
  const { user, refreshUser, isLoading: authLoading } = useAuth()
  const [view, setView] = useState<View>('loading')
  // Der Abruf läuft genau einmal; refreshUser() ändert `user` und würde einen
  // Effekt mit `user` in den Abhängigkeiten sonst erneut auslösen.
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (authLoading || hasLoaded.current) return
    hasLoaded.current = true

    let active = true

    const load = async () => {
      /*
       * Fehlt das Geburtsdatum im Kontext, einmal nachfassen.
       *
       * Das Nutzerobjekt kann beim Start aus dem localStorage kommen, ohne dass
       * /users/me erneut gefragt wurde (siehe AuthContext) — ein veralteter
       * Eintrag ließe sich so auffrischen. Liefert der Endpunkt das Feld gar
       * nicht, bleibt es dabei und das Formular fragt das Alter ab.
       *
       * Läuft parallel zum Statusabruf und wird mitabgewartet, damit das
       * Formular nicht erst ohne und dann mit Geburtsdatum erscheint.
       */
      const refresh = user?.dateOfBirth
        ? Promise.resolve()
        : refreshUser().catch(() => {
            // Nicht kritisch — ohne Geburtsdatum wird das Alter abgefragt.
          })

      try {
        const [payload] = await Promise.all([creatorService.getMyApplication(), refresh])
        if (!active) return

        /*
         * Die Zuordnung Stand → Ansicht liegt im Service (resolveCreatorStanding),
         * damit die Einstellungen denselben Stand zeigen wie diese Seite.
         * Nur 'none' heisst hier anders: Ohne Bewerbung kommt das Formular.
         */
        if (!payload) {
          setView('error')
        } else {
          const standing = resolveCreatorStanding(payload)
          setView(standing === 'none' ? 'form' : standing)
        }
      } catch {
        if (!active) return
        /*
         * Ein 401 landet hier nicht: Der Interceptor in services/api.ts leitet
         * vorher auf /login um, weil diese Route nicht öffentlich ist. Bleibt
         * also der Fall, dass der Endpunkt gar nicht erreichbar war.
         */
        setView('error')
      }
    }

    load()
    return () => {
      active = false
    }
  }, [authLoading, refreshUser, user?.dateOfBirth])

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardContent className="p-6">
          {/* Ladezustand zuerst — das Formular darf nicht kurz aufblitzen. */}
          {view === 'loading' && (
            <div className="space-y-3">
              <div className="h-10 bg-muted animate-pulse rounded-md" />
              <div className="h-10 bg-muted animate-pulse rounded-md" />
              <div className="h-10 bg-muted animate-pulse rounded-md" />
            </div>
          )}

          {view === 'form' && (
            <CreatorApplicationForm onSubmitted={() => setView('pending')} />
          )}

          {view === 'member' && (
            <StatusPanel
              icon={<Sparkles className="h-8 w-8 text-white" />}
              title={t('influencer.statusMemberTitle', {
                defaultValue: 'Du bist bereits Teil des Creator Clubs.',
              })}
              description={t('influencer.statusMemberDesc', {
                defaultValue: 'Schön, dass du dabei bist. Deine Vorteile findest du in der App.',
              })}
              action={
                <Link href={localePath('/explore')}>
                  <Button variant="gradient">
                    {t('brandRegister.doneButton', { defaultValue: 'Events entdecken' })}
                  </Button>
                </Link>
              }
            />
          )}

          {view === 'pending' && (
            <StatusPanel
              icon={<Clock className="h-8 w-8 text-white" />}
              title={t('influencer.statusPendingTitle', {
                defaultValue: 'Deine Bewerbung wird geprüft.',
              })}
              description={t('influencer.statusPendingDesc', {
                defaultValue: 'Wir sehen sie uns an und melden uns bei dir. Das dauert meist ein paar Tage.',
              })}
              action={
                <Link href={localePath('/explore')}>
                  <Button variant="outline">
                    {t('brandRegister.doneButton', { defaultValue: 'Events entdecken' })}
                  </Button>
                </Link>
              }
            />
          )}

          {view === 'approved' && (
            <StatusPanel
              icon={<Check className="h-8 w-8 text-white" />}
              title={t('influencer.statusApprovedTitle', {
                defaultValue: 'Deine Bewerbung wurde angenommen.',
              })}
              description={t('influencer.statusApprovedDesc', {
                defaultValue: 'Dein Creator-Profil wird gerade eingerichtet. Wir melden uns, sobald es bereit ist.',
              })}
              action={
                <Link href={localePath('/explore')}>
                  <Button variant="gradient">
                    {t('brandRegister.doneButton', { defaultValue: 'Events entdecken' })}
                  </Button>
                </Link>
              }
            />
          )}

          {view === 'rejected' && (
            <StatusPanel
              icon={<XCircle className="h-8 w-8 text-white" />}
              title={t('influencer.statusRejectedTitle', {
                defaultValue: 'Leider nicht angenommen.',
              })}
              description={t('influencer.statusRejectedDesc', {
                defaultValue:
                  'Diesmal hat es nicht gepasst. Du kannst Share Your Party natürlich weiter wie gewohnt nutzen.',
              })}
              action={
                <Link href={localePath('/explore')}>
                  <Button variant="outline">
                    {t('brandRegister.doneButton', { defaultValue: 'Events entdecken' })}
                  </Button>
                </Link>
              }
            />
          )}

          {view === 'error' && (
            <StatusPanel
              icon={<XCircle className="h-8 w-8 text-white" />}
              title={t('common.error', { defaultValue: 'Fehler' })}
              description={t('influencer.statusLoadFailed', {
                defaultValue: 'Der Stand deiner Bewerbung lässt sich gerade nicht laden. Bitte versuche es später erneut.',
              })}
              action={
                <Button variant="outline" onClick={() => window.location.reload()}>
                  {t('common.retry', { defaultValue: 'Erneut versuchen' })}
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatusPanel({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="text-center py-10 px-4">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#ff720e] via-[#ff4d3c] to-[#e9548c]">
        {icon}
      </div>
      <h1 className="text-xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  )
}
