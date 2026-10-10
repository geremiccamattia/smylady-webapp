'use client'

import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  buildSchedule,
  defaultDay,
  endsNextDay,
  formatScheduleDay,
  isDailyHoursEdited,
  isForcedNextDay,
  scheduleBounds,
  MAX_SCHEDULE_ENTRIES,
  type DailyHoursDay,
  type DailyHoursState,
  type DailyHoursWindow,
  type ScheduleError,
} from '@/lib/eventSchedule'

/** Mehr als zwei Fenster je Tag braucht kein bisher bekanntes Format. */
const MAX_WINDOWS_PER_DAY = 2

/** Meldung zu validateSchedule — dieselbe in CreateEvent und EditEvent. */
export function scheduleErrorMessage(error: ScheduleError, t: TFunction): string {
  switch (error) {
    case 'missingTime':
      return t('dailyHours.errorMissingTime', {
        defaultValue: 'Bitte gib bei jedem geöffneten Tag Beginn und Ende an.',
      })
    case 'overlap':
      return t('dailyHours.errorOverlap', {
        defaultValue: 'Zwei Zeitfenster überschneiden sich. Bitte prüfe die Öffnungszeiten.',
      })
    case 'tooMany':
      return t('dailyHours.errorTooMany', {
        defaultValue: 'Es sind höchstens {{max}} Zeitfenster möglich.',
        max: MAX_SCHEDULE_ENTRIES,
      })
    case 'allClosed':
      return t('dailyHours.errorAllClosed', {
        defaultValue: 'Mindestens ein Tag muss geöffnet sein.',
      })
  }
}

interface DailyHoursEditorProps {
  /** Die Tage zwischen Start- und Enddatum, von der Elternkomponente berechnet. */
  days: string[]
  value: DailyHoursState
  onChange: (next: DailyHoursState) => void
  /** Beginn und Ende aus dem Hauptformular — Vorgabe für jeden Tag. */
  defaults: { startTime: string; endTime: string }
}

/**
 * Öffnungszeiten je Tag für mehrtägige Events.
 *
 * Solange niemand einen Tag anfasst, zeigt die Liste nur die Vorgabe aus dem
 * Hauptformular und `value` bleibt leer — es wird kein schedule gesendet. Die
 * erste Änderung schreibt alle angezeigten Tage mit ihrer Vorgabe fest, damit
 * eine spätere Änderung an Beginn oder Ende im Hauptformular nicht unbemerkt
 * die Hälfte der Tage verschiebt.
 *
 * Der Stand ist nach Datum geschlüsselt: Ändert sich der Zeitraum, bleiben die
 * Eingaben für Tage erhalten, die es weiterhin gibt.
 */
export function DailyHoursEditor({ days, value, onChange, defaults }: DailyHoursEditorProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'de-DE'

  const edited = isDailyHoursEdited(days, value)
  const getDay = (date: string): DailyHoursDay => value[date] ?? defaultDay(defaults)

  const updateDay = (date: string, update: (day: DailyHoursDay) => DailyHoursDay) => {
    const next: DailyHoursState = { ...value }
    for (const day of days) {
      if (!(day in next)) next[day] = defaultDay(defaults)
    }
    next[date] = update(next[date])
    onChange(next)
  }

  const updateWindow = (date: string, index: number, patch: Partial<DailyHoursWindow>) =>
    updateDay(date, day => ({
      ...day,
      windows: day.windows.map((w, i) => (i === index ? { ...w, ...patch } : w)),
    }))

  const bounds = edited ? scheduleBounds(buildSchedule(days, value, defaults)) : null

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-sm">
            {t('dailyHours.title', { defaultValue: 'Öffnungszeiten je Tag' })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('dailyHours.hint', {
              defaultValue: 'Optional. Leer lassen, wenn an jedem Tag dieselben Zeiten gelten.',
            })}
          </p>
        </div>
        {edited && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="text-xs text-muted-foreground hover:text-foreground underline shrink-0"
          >
            {t('dailyHours.reset', { defaultValue: 'Zurücksetzen' })}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {days.map(date => {
          const day = getDay(date)
          return (
            <div key={date} className="rounded-md bg-muted/40 p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{formatScheduleDay(date, locale)}</span>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.closed}
                    onChange={e =>
                      updateDay(date, d => ({
                        ...d,
                        closed: e.target.checked,
                        // Wer einen geschlossenen Tag wieder öffnet, braucht ein Fenster.
                        windows: d.windows.length ? d.windows : defaultDay(defaults).windows,
                      }))
                    }
                    className="h-4 w-4"
                  />
                  {t('dailyHours.closed', { defaultValue: 'Geschlossen' })}
                </label>
              </div>

              {!day.closed &&
                day.windows.map((window, index) => {
                  const forced = isForcedNextDay(window)
                  return (
                    <div key={index} className="flex flex-wrap items-center gap-2">
                      <Input
                        type="time"
                        aria-label={t('dailyHours.from', { defaultValue: 'Von' })}
                        value={window.startTime}
                        onChange={e => updateWindow(date, index, { startTime: e.target.value })}
                        className="w-28"
                      />
                      <span className="text-muted-foreground">–</span>
                      <Input
                        type="time"
                        aria-label={t('dailyHours.until', { defaultValue: 'Bis' })}
                        value={window.endTime}
                        onChange={e => updateWindow(date, index, { endTime: e.target.value })}
                        className="w-28"
                      />
                      {/* Ein Ende vor dem Beginn geht nur über Mitternacht — dann ist der
                          Haken gesetzt und fest, sonst lehnte das Backend mit 400 ab. */}
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={endsNextDay(window)}
                          disabled={forced}
                          onChange={e => updateWindow(date, index, { nextDay: e.target.checked })}
                          className="h-4 w-4"
                        />
                        {t('dailyHours.nextDay', { defaultValue: 'endet am Folgetag' })}
                      </label>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            updateDay(date, d => ({ ...d, windows: d.windows.filter((_, i) => i !== index) }))
                          }
                          aria-label={t('dailyHours.removeWindow', { defaultValue: 'Zeitfenster entfernen' })}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )
                })}

              {!day.closed && day.windows.length < MAX_WINDOWS_PER_DAY && (
                <button
                  type="button"
                  onClick={() =>
                    updateDay(date, d => ({
                      ...d,
                      windows: [...d.windows, { startTime: '', endTime: '', nextDay: false }],
                    }))
                  }
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('dailyHours.addWindow', { defaultValue: 'Zeitfenster hinzufügen' })}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Mit schedule leitet das Backend Beginn und Ende des Events daraus ab. Ist
          der erste Tag geschlossen, beginnt das Event später als oben eingetragen. */}
      {bounds && (
        <p className="text-xs text-muted-foreground">
          {t('dailyHours.derivedRange', {
            defaultValue: 'Dein Event läuft laut Öffnungszeiten von {{start}} bis {{end}}.',
            start: `${formatScheduleDay(bounds.startDate, locale)} ${bounds.startTime}`,
            end: `${formatScheduleDay(bounds.endDate, locale)} ${bounds.endTime}`,
          })}
        </p>
      )}
    </div>
  )
}
