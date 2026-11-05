'use client'

import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type OrganizerType = 'business' | 'private'

export const ORGANIZER_IMPRINT_MAX = 1000

/**
 * Prüft die Angabe zum Veranstalter-Status. Liefert einen i18n-Schlüssel samt
 * Standardtext für die Fehlermeldung oder null, wenn alles passt.
 */
export function validateOrganizerStatus(
  type: OrganizerType | null | undefined,
  imprint: string,
): { key: string; defaultValue: string } | null {
  if (!type) {
    return { key: 'organizerStatus.required', defaultValue: 'Bitte gib an, ob du als Unternehmer oder als Privatperson auftrittst.' }
  }
  if (type === 'business' && !imprint.trim()) {
    return { key: 'organizerStatus.imprintRequired', defaultValue: 'Als Unternehmer musst du ein Impressum angeben.' }
  }
  if (imprint.length > ORGANIZER_IMPRINT_MAX) {
    return { key: 'organizerStatus.imprintTooLong', defaultValue: 'Das Impressum darf höchstens 1000 Zeichen lang sein.' }
  }
  return null
}

interface OrganizerStatusFieldsProps {
  type: OrganizerType | null
  imprint: string
  onTypeChange: (type: OrganizerType) => void
  onImprintChange: (imprint: string) => void
  idPrefix?: string
  disabled?: boolean
}

/**
 * Veranstalter-Status (H4): Unternehmer oder Privatperson. Davon hängt ab, ob
 * Käufern gegenüber Verbraucherschutzrechte gelten — deshalb wird die Angabe
 * auf der Eventseite und im Kaufdialog angezeigt. Unternehmer müssen ein
 * Impressum hinterlegen (§ 5 ECG, § 25 MedienG).
 */
export function OrganizerStatusFields({
  type,
  imprint,
  onTypeChange,
  onImprintChange,
  idPrefix = 'organizer',
  disabled = false,
}: OrganizerStatusFieldsProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label={t('organizerStatus.title', { defaultValue: 'Veranstalter-Status' })} className="space-y-2">
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name={`${idPrefix}-type`}
            value="business"
            checked={type === 'business'}
            onChange={() => onTypeChange('business')}
            disabled={disabled}
            className="mt-0.5 h-4 w-4"
          />
          <span>{t('organizerStatus.business', { defaultValue: 'Ich trete als Unternehmer auf' })}</span>
        </label>
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name={`${idPrefix}-type`}
            value="private"
            checked={type === 'private'}
            onChange={() => onTypeChange('private')}
            disabled={disabled}
            className="mt-0.5 h-4 w-4"
          />
          <span>{t('organizerStatus.private', { defaultValue: 'Ich trete als Privatperson auf' })}</span>
        </label>
      </div>

      {type === 'private' && (
        <p className="text-xs text-muted-foreground">
          {t('organizerStatus.privateHint', {
            defaultValue:
              'Gästen wird angezeigt, dass du privat veranstaltest und ihnen gegenüber keine Verbraucherschutzrechte (z. B. Rücktrittsrecht) gelten.',
          })}
        </p>
      )}

      {type === 'business' && (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-imprint`}>
            {t('organizerStatus.imprint', { defaultValue: 'Impressum' })} *
          </Label>
          <Textarea
            id={`${idPrefix}-imprint`}
            value={imprint}
            onChange={(e) => onImprintChange(e.target.value)}
            maxLength={ORGANIZER_IMPRINT_MAX}
            rows={4}
            disabled={disabled}
            className="resize-y"
            placeholder={t('organizerStatus.imprintPlaceholder', {
              defaultValue: 'Max Muster GmbH\nMusterstraße 1, 1010 Wien\nkontakt@example.com\nUID: ATU12345678',
            })}
          />
          <p className="text-xs text-muted-foreground">
            {t('organizerStatus.imprintHint', {
              defaultValue: 'Name bzw. Firma, Anschrift, E-Mail-Adresse und ggf. UID-Nummer. Wird auf deinen Eventseiten angezeigt.',
            })}{' '}
            ({imprint.length}/{ORGANIZER_IMPRINT_MAX})
          </p>
        </div>
      )}
    </div>
  )
}
