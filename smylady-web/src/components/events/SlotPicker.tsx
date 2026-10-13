'use client'

import { useTranslation } from 'react-i18next'
import type { EventSlot } from '@/types'
import { cn } from '@/lib/utils'
import { formatScheduleDay } from '@/lib/eventSchedule'
import { formatSlot, groupSlotsByDay, slotButtonLabels } from '@/lib/eventSlots'

interface SlotPickerProps {
  slots: EventSlot[]
  durationMinutes: number | null | undefined
  /** Gewählter Slotbeginn (UTC-Zeitpunkt) oder null — null ist ein gültiger Endzustand. */
  value: string | null
  onChange: (slotStart: string | null) => void
}

/** Zwei Zeitpunkte als gleich behandeln, auch wenn sie unterschiedlich formatiert ankommen. */
const sameInstant = (a: string | null, b: string) => a !== null && Date.parse(a) === Date.parse(b)

/**
 * Freiwillige Angabe, wann der Käufer ungefähr kommt — gruppiert nach
 * Öffnungstag, alle Zeiten in Wiener Zeit.
 *
 * Bewusst einladend formuliert und ohne Pflichtcharakter: Nichts ist
 * vorausgewählt, ein zweiter Tipp auf den gewählten Slot hebt die Wahl wieder
 * auf, und der Kauf geht ohne Angabe genauso.
 */
export function SlotPicker({ slots, durationMinutes, value, onChange }: SlotPickerProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'de-DE'
  const groups = groupSlotsByDay(slots)
  if (groups.length === 0) return null

  const selectedLabel = value ? formatSlot(value, durationMinutes, locale, t) : null

  return (
    <div className="space-y-3 rounded-lg border p-3" role="group" aria-labelledby="slot-picker-title">
      <div>
        <p id="slot-picker-title" className="text-sm font-medium">
          {t('timeslots.question', { defaultValue: 'Wann kommst du ungefähr?' })}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('timeslots.voluntary', { defaultValue: 'Freiwillig – hilft dem Veranstalter bei der Planung.' })}
        </p>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
        {groups.map(group => {
          // Pro Öffnungstag: doppelte Startzeiten (Zeitumstellung) mit Zonenkurzform.
          const labels = slotButtonLabels(group.slots, locale)
          return (
            <div key={group.date}>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                {formatScheduleDay(group.date, locale)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.slots.map((slot, index) => {
                  const selected = sameInstant(value, slot.start)
                  return (
                    <button
                      key={slot.start}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onChange(selected ? null : slot.start)}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-sm tabular-nums transition-colors',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted hover:border-primary/50',
                      )}
                    >
                      {labels[index]}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {selectedLabel && (
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">
            {t('timeslots.selected', { defaultValue: 'Du kommst ungefähr {{slot}}', slot: selectedLabel })}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 text-muted-foreground underline hover:text-foreground"
          >
            {t('timeslots.clear', { defaultValue: 'Keine Angabe' })}
          </button>
        </div>
      )}
    </div>
  )
}
