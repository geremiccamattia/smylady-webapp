'use client'

import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
}

/** Schalter im Stil des Gewinnspiel-Schalters in CreateEvent. */
function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
        checked ? 'bg-amber-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export interface RaffleSettingsFieldsProps {
  drawOnSite: boolean
  onDrawOnSiteChange: (next: boolean) => void
  notifyWinnerByEmail: boolean
  onNotifyWinnerByEmailChange: (next: boolean) => void
  partner: string
  onPartnerChange: (next: string) => void
  partnerMarketing: boolean
  onPartnerMarketingChange: (next: boolean) => void
  /** Ob am Event ein Ziehungstermin gesetzt ist — steuert nur den Warnhinweis. */
  hasDrawDate: boolean
}

/**
 * Gewinnspiel-Einstellungen, die den Wortlaut der Teilnahmebedingungen bestimmen.
 * Wird von CreateEvent und EditEvent gemeinsam genutzt — der Text ist rechtlich
 * bindend, deshalb darf es die Eingabemaske dafür nur einmal geben.
 */
export function RaffleSettingsFields({
  drawOnSite,
  onDrawOnSiteChange,
  notifyWinnerByEmail,
  onNotifyWinnerByEmailChange,
  partner,
  onPartnerChange,
  partnerMarketing,
  onPartnerMarketingChange,
  hasDrawDate,
}: RaffleSettingsFieldsProps) {
  const { t } = useTranslation()
  const hasPartner = partner.trim().length > 0

  return (
    <div className="space-y-3">
      {/* Verlosung vor Ort */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label>
            {t('createEvent.raffleDrawOnSite', { defaultValue: 'Verlosung findet vor Ort statt' })}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t('createEvent.raffleDrawOnSiteHint', {
              defaultValue:
                'Der Gewinner muss bei der Ziehung anwesend sein. Steht so auch in den Teilnahmebedingungen.',
            })}
          </p>
        </div>
        <Toggle checked={drawOnSite} onChange={onDrawOnSiteChange} />
      </div>

      {drawOnSite && !hasDrawDate && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            {t('createEvent.raffleDrawOnSiteNeedsDate', {
              defaultValue:
                'Bei einer Verlosung vor Ort sollte ein Ziehungstermin gesetzt sein — sonst fehlt er in den Teilnahmebedingungen.',
            })}
          </p>
        </div>
      )}

      {/* Gewinner per E-Mail benachrichtigen */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label>
            {t('createEvent.raffleNotifyWinnerByEmail', {
              defaultValue: 'Gewinner per E-Mail benachrichtigen',
            })}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t('createEvent.raffleNotifyWinnerByEmailHint', {
              defaultValue: 'Der Gewinner erhält zusätzlich zur App-Meldung eine E-Mail.',
            })}
          </p>
        </div>
        <Toggle checked={notifyWinnerByEmail} onChange={onNotifyWinnerByEmailChange} />
      </div>

      {/* Partner */}
      <div className="space-y-2">
        <Label>
          {t('createEvent.rafflePartner', { defaultValue: 'Partner, der die Teilnehmerdaten erhält' })}
        </Label>
        <Input
          value={partner}
          onChange={(e) => onPartnerChange(e.target.value)}
          placeholder={t('createEvent.rafflePartnerPlaceholder', { defaultValue: 'z.B. Volxfest' })}
        />
        <p className="text-xs text-muted-foreground">
          {t('createEvent.rafflePartnerHint', {
            defaultValue:
              'Ohne Angabe werden die Daten an niemanden weitergegeben — das steht dann auch so in den Teilnahmebedingungen.',
          })}
        </p>
      </div>

      {/* Marketing — nur sinnvoll, wenn es überhaupt einen Partner gibt */}
      {hasPartner && (
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label>
              {t('createEvent.rafflePartnerMarketing', {
                defaultValue: 'Partner darf die E-Mail-Adressen für Marketing nutzen',
              })}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('createEvent.rafflePartnerMarketingHint', {
                defaultValue:
                  'Teilnehmer willigen mit der Teilnahme ein. Ergänzt einen Absatz in den Teilnahmebedingungen.',
              })}
            </p>
          </div>
          <Toggle checked={partnerMarketing} onChange={onPartnerMarketingChange} />
        </div>
      )}
    </div>
  )
}

export default RaffleSettingsFields
