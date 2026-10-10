'use client'

import { useTranslation } from 'react-i18next'
import type { EventScheduleEntry } from '@/types'
import { cn } from '@/lib/utils'
import { formatScheduleDay, groupScheduleByDay, viennaNow } from '@/lib/eventSchedule'
import { useNow } from '@/hooks/useNow'

/**
 * Öffnungszeiten eines mehrtägigen Events, ein Tag je Zeile.
 *
 * Tage zwischen dem ersten und letzten Öffnungstag ohne Fenster erscheinen
 * als „geschlossen". Der heutige Tag — in Wiener Zeit — wird hervorgehoben,
 * aber erst nach dem Mount (useNow), sonst unterschiede sich das HTML von
 * Server und Browser.
 */
export function OpeningHours({ schedule }: { schedule: EventScheduleEntry[] }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'de-DE'
  const now = useNow()
  const today = now ? viennaNow(now).date : null

  return (
    <ul className="space-y-1 text-sm">
      {groupScheduleByDay(schedule).map(({ date, windows }) => {
        const isToday = date === today
        return (
          <li
            key={date}
            className={cn(
              'flex justify-between gap-3 rounded-md px-2 py-1',
              isToday && 'bg-primary/10 font-semibold text-foreground',
            )}
          >
            <span>
              {formatScheduleDay(date, locale)}
              {isToday && (
                <span className="ml-1.5 text-xs text-primary">
                  {t('dailyHours.today', { defaultValue: 'Heute' })}
                </span>
              )}
            </span>
            <span className={cn('text-right', windows.length === 0 && 'text-muted-foreground')}>
              {windows.length === 0
                ? t('dailyHours.closedDisplay', { defaultValue: 'geschlossen' })
                : windows.map(w => `${w.startTime} – ${w.endTime}`).join(', ')}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
