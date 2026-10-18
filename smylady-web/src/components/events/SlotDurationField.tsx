'use client'

import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { SLOT_DURATION_OPTIONS } from '@/lib/eventSlots'

interface SlotDurationFieldProps {
  /** Dauer in Minuten als String; '' heißt „keine Zeitfenster". */
  value: string
  onChange: (value: string) => void
}

/**
 * Länge der freiwillig wählbaren Zeitfenster beim Ticketkauf.
 *
 * Nur sinnvoll mit Öffnungszeiten je Tag — daraus rechnet das Backend die
 * Slots. Die Elternkomponente blendet das Feld deshalb nur dann ein.
 *
 * Ein Wert außerhalb der festen Liste (etwa per API gesetzt) bleibt als
 * eigene Option erhalten, statt beim Bearbeiten stillschweigend zu verfallen.
 */
export function SlotDurationField({ value, onChange }: SlotDurationFieldProps) {
  const { t } = useTranslation()
  const current = Number(value)
  const options: number[] = [...SLOT_DURATION_OPTIONS]
  if (value && Number.isInteger(current) && !options.includes(current)) {
    options.push(current)
    options.sort((a, b) => a - b)
  }

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <Label htmlFor="slotDurationMinutes">
        {t('timeslots.durationLabel', { defaultValue: 'Zeitfenster' })}
      </Label>
      <select
        id="slotDurationMinutes"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">{t('timeslots.durationNone', { defaultValue: 'Keine Zeitfenster' })}</option>
        {options.map(minutes => (
          <option key={minutes} value={String(minutes)}>
            {t('timeslots.durationMinutes', { defaultValue: '{{count}} Minuten', count: minutes })}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        {t('timeslots.durationHint', {
          defaultValue:
            'Käufer können beim Ticketkauf freiwillig angeben, wann sie ungefähr kommen. Du siehst die Angaben in der Gästeliste.',
        })}
      </p>
    </div>
  )
}
