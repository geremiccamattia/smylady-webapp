'use client'

import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { AlertCircle } from 'lucide-react'
import type { ConnectedAccount } from '@/services/stripe'

/** Der Prüffehler, für den es einen eigenen, verständlichen Hinweis gibt. */
const KEYED_IDENTITY = 'verification_failed_keyed_identity'

/**
 * Deutsche bzw. englische Bezeichnung eines Stripe-Feldnamens.
 *
 * Die Bezeichnungen stehen in de.json/en.json unter stripeRequirements.fields,
 * verschachtelt nach dem Feldnamen — i18next trennt Schlüssel am Punkt, so
 * findet "individual.address.city" seinen Eintrag direkt. Kein Eintrag (oder
 * nur ein Zwischenknoten wie "individual.address"): der Feldname unverändert,
 * damit nichts verschluckt wird.
 */
function fieldLabel(field: string, t: TFunction): string {
  const value = t(`stripeRequirements.fields.${field}`, { returnObjects: true, defaultValue: field })
  return typeof value === 'string' && value !== '' ? value : field
}

/**
 * Offene Punkte als Zeilen: fällige (pastDue) und aktuell geforderte
 * (currentlyDue) Felder zusammen, nach Bezeichnung entdoppelt — so ergeben
 * tos_acceptance.date und .ip nur eine Zeile. Reihenfolge wie bei Stripe.
 */
export function stripeRequirementLines(account: ConnectedAccount | undefined, t: TFunction): string[] {
  const fields = [...(account?.pastDue ?? []), ...(account?.currentlyDue ?? [])]
  const lines: string[] = []
  for (const field of fields) {
    const label = fieldLabel(field, t)
    if (!lines.includes(label)) lines.push(label)
  }
  return lines
}

/**
 * Erklärende Sätze zu den Prüffehlern, entdoppelt: Für fehlgeschlagene
 * Identitätsprüfung ein eigener Hinweis, für alle anderen Codes der Rohtext
 * von Stripe — nicht unterschlagen, auch wenn er englisch ist.
 */
export function stripeRequirementNotes(account: ConnectedAccount | undefined, t: TFunction): string[] {
  const notes: string[] = []
  for (const error of account?.requirementErrors ?? []) {
    const note =
      error.code === KEYED_IDENTITY
        ? t('stripeRequirements.verificationFailedKeyedIdentity', {
            defaultValue:
              'Stripe konnte deine Angaben nicht überprüfen. Sie müssen genau mit deinem amtlichen Ausweis übereinstimmen. Alternativ kannst du ein Ausweisdokument hochladen.',
          })
        : error.reason || error.code
    if (note && !notes.includes(note)) notes.push(note)
  }
  return notes
}

/**
 * Was Stripe noch braucht, bevor das Konto freigeschaltet wird. Rendert nichts,
 * solange Stripe keine offenen Punkte und keine Prüffehler meldet — auch bei
 * einem älteren Backend ohne diese Felder.
 */
export function StripeRequirements({ account }: { account: ConnectedAccount | undefined }) {
  const { t } = useTranslation()
  const lines = stripeRequirementLines(account, t)
  const notes = stripeRequirementNotes(account, t)
  if (lines.length === 0 && notes.length === 0) return null

  return (
    <div className="space-y-2 rounded-lg border border-yellow-200 dark:border-yellow-800 p-3">
      <p className="flex items-center gap-2 text-sm font-medium">
        <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0" />
        {t('stripeRequirements.title', { defaultValue: 'Das braucht Stripe noch von dir' })}
      </p>
      {lines.length > 0 && (
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-0.5">
          {lines.map(line => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {notes.map(note => (
        <p key={note} className="text-sm text-muted-foreground">
          {note}
        </p>
      ))}
    </div>
  )
}
