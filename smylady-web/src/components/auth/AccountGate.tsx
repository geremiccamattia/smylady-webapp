'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/auth'
import { legalPath } from '@/lib/legal'

/**
 * Pflichtdialoge nach dem Login (API-Vertrag DSGVO 05.11.2026, H1/H2).
 *
 * Reihenfolge: zuerst das Geburtsdatum (Social-Login ohne Geburtsdatum,
 * `needsDateOfBirth`), dann die Zustimmung zur aktuellen AGB-/DSE-Version
 * (`termsUpToDate === false`). Beide Dialoge lassen sich nicht schließen —
 * einziger Ausweg ist die Abmeldung.
 *
 * Bewusst nur bei ausdrücklichem `true` bzw. `false`: Fehlen die Felder
 * (älteres Backend, Cache), erscheint nichts.
 *
 * Auf den Rechtsseiten selbst bleibt der Dialog weg, damit die verlinkten
 * Texte lesbar sind.
 */
const LEGAL_PAGE = /^(\/en)?\/(terms|privacy|imprint)(\/|$)/

function isAdult(isoDate: string): boolean {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return false
  const now = new Date()
  const cutoff = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate())
  return new Date(y, m - 1, d) <= cutoff
}

function readMessage(error: unknown): string | null {
  const data = (error as { response?: { data?: { message?: unknown } } })?.response?.data
  const msg = data?.message
  if (typeof msg === 'string' && msg) return msg
  if (Array.isArray(msg) && typeof msg[0] === 'string') return msg[0]
  return null
}

function errorStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } })?.response?.status
}

/** Dialog ohne Schließen-Kreuz, Escape oder Klick daneben. */
function LockedDialog({ children, title, description }: { children: React.ReactNode; title: string; description: string }) {
  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent
        className="sm:max-w-md [&>button:last-child]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

function DateOfBirthStep() {
  const { t } = useTranslation()
  const { user, updateUser, refreshUser, logout } = useAuth()
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tooYoung, setTooYoung] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!dateOfBirth) return
    if (!isAdult(dateOfBirth)) {
      setTooYoung(true)
      setError(t('accountGate.tooYoung', { defaultValue: 'Du musst mindestens 18 Jahre alt sein.' }))
      return
    }
    setSaving(true)
    try {
      const result = await authService.setDateOfBirth(dateOfBirth)
      if (user) {
        updateUser({ ...user, dateOfBirth: result?.dateOfBirth ?? dateOfBirth, needsDateOfBirth: false })
      }
      void refreshUser()
    } catch (err) {
      if (errorStatus(err) === 400) {
        setTooYoung(true)
        setError(t('accountGate.tooYoung', { defaultValue: 'Du musst mindestens 18 Jahre alt sein.' }))
      } else {
        setError(readMessage(err) ?? t('errors.general', { defaultValue: 'Ein Fehler ist aufgetreten' }))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <LockedDialog
      title={t('accountGate.dobTitle', { defaultValue: 'Geburtsdatum angeben' })}
      description={t('accountGate.dobDesc', {
        defaultValue: 'Share Your Party ist erst ab 18 Jahren nutzbar. Bitte gib dein Geburtsdatum an, um fortzufahren.',
      })}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gate-dob">{t('auth.dateOfBirth', { defaultValue: 'Geburtsdatum' })}</Label>
          <Input
            id="gate-dob"
            type="date"
            value={dateOfBirth}
            onChange={(e) => {
              setDateOfBirth(e.target.value)
              setError(null)
            }}
            max={new Date().toISOString().slice(0, 10)}
            required
            disabled={saving}
          />
          <p className="text-xs text-muted-foreground">
            {t('accountGate.dobHint', { defaultValue: 'Nur für Personen ab 18 Jahren. Das Datum wird nicht öffentlich angezeigt.' })}
          </p>
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={logout} disabled={saving}>
            {t('accountGate.logout', { defaultValue: 'Abmelden' })}
          </Button>
          {!tooYoung && (
            <Button type="submit" loading={saving} disabled={!dateOfBirth}>
              {t('common.continue', { defaultValue: 'Weiter' })}
            </Button>
          )}
          {tooYoung && (
            <Button type="submit" variant="secondary" loading={saving} disabled={!dateOfBirth}>
              {t('accountGate.retry', { defaultValue: 'Datum korrigieren' })}
            </Button>
          )}
        </div>
      </form>
    </LockedDialog>
  )
}

function TermsStep() {
  const { t, i18n } = useTranslation()
  const { user, updateUser, refreshUser, logout } = useAuth()
  const [accepted, setAccepted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    if (!accepted) return
    setSaving(true)
    setError(null)
    try {
      const result = await authService.acceptTerms()
      if (user) {
        updateUser({ ...user, ...(result ?? {}), term_and_condition: true, termsUpToDate: true })
      }
      void refreshUser()
    } catch (err) {
      setError(readMessage(err) ?? t('errors.general', { defaultValue: 'Ein Fehler ist aufgetreten' }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <LockedDialog
      title={t('accountGate.termsTitle', { defaultValue: 'Unsere AGB und Datenschutzerklärung wurden aktualisiert' })}
      description={t('accountGate.termsDesc', {
        defaultValue: 'Bitte lies die aktuellen Fassungen und bestätige sie, um Share Your Party weiter zu nutzen.',
      })}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href={legalPath('terms', i18n.language)} target="_blank" className="text-primary hover:underline">
            {t('legal.terms', { defaultValue: 'AGB' })}
          </Link>
          <Link href={legalPath('privacy', i18n.language)} target="_blank" className="text-primary hover:underline">
            {t('auth.privacyLink', { defaultValue: 'Datenschutzerklärung' })}
          </Link>
        </div>
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-input"
            aria-required="true"
          />
          <span>
            {t('accountGate.termsCheckbox', {
              defaultValue: 'Ich akzeptiere die aktuellen AGB und habe die Datenschutzerklärung zur Kenntnis genommen.',
            })}
          </span>
        </label>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={logout} disabled={saving}>
            {t('accountGate.logout', { defaultValue: 'Abmelden' })}
          </Button>
          <Button type="button" onClick={confirm} loading={saving} disabled={!accepted}>
            {t('accountGate.termsConfirm', { defaultValue: 'Zustimmen und fortfahren' })}
          </Button>
        </div>
      </div>
    </LockedDialog>
  )
}

export default function AccountGate() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname() ?? ''

  if (isLoading || !isAuthenticated || !user) return null
  if (LEGAL_PAGE.test(pathname)) return null

  if (user.needsDateOfBirth === true) return <DateOfBirthStep />
  if (user.termsUpToDate === false) return <TermsStep />
  return null
}
