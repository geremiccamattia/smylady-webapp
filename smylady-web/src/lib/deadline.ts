'use client'

import { useEffect, useState } from 'react'

/**
 * Restzeit bis zu einer Frist, für Angebote (Brand) und
 * Verfügbarkeitsanfragen (Creator).
 */
export interface RemainingTime {
  expired: boolean
  days: number
  hours: number
  minutes: number
  /** Gesamtrest in Millisekunden, 0 wenn abgelaufen. */
  totalMs: number
}

export function remainingTime(deadline: string | Date | null | undefined, now: Date = new Date()): RemainingTime | null {
  if (!deadline) return null
  const end = deadline instanceof Date ? deadline : new Date(deadline)
  if (isNaN(end.getTime())) return null

  const totalMs = Math.max(0, end.getTime() - now.getTime())
  const minutesTotal = Math.floor(totalMs / 60000)
  return {
    expired: totalMs === 0,
    days: Math.floor(minutesTotal / (60 * 24)),
    hours: Math.floor((minutesTotal % (60 * 24)) / 60),
    minutes: minutesTotal % 60,
    totalMs,
  }
}

/** Restzeit, die sich von selbst aktualisiert (jede Minute). */
export function useCountdown(deadline: string | Date | null | undefined, tickMs = 60_000): RemainingTime | null {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!deadline) return
    const timer = setInterval(() => setNow(new Date()), tickMs)
    return () => clearInterval(timer)
  }, [deadline, tickMs])

  return remainingTime(deadline, now)
}

/**
 * „3 Tage 4 Std", „5 Std 12 Min", „12 Min" — kurz, für Badges und Hinweise.
 * Die Einheiten kommen vom Aufrufer, damit sie übersetzt sind.
 */
export function formatRemaining(
  remaining: RemainingTime,
  units: { days: string; hours: string; minutes: string },
): string {
  if (remaining.expired) return ''
  if (remaining.days > 0) return `${remaining.days} ${units.days} ${remaining.hours} ${units.hours}`
  if (remaining.hours > 0) return `${remaining.hours} ${units.hours} ${remaining.minutes} ${units.minutes}`
  return `${Math.max(1, remaining.minutes)} ${units.minutes}`
}
