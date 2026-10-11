import type { CreatorAssignment } from '@/services/creator'
import { isEventOver } from '@/lib/utils'

/**
 * Einnahmen eines Creators, aus seinen Aufträgen berechnet.
 *
 * Es gibt (noch) keine Auszahlungsdaten. "Einnahme" heisst deshalb: ein
 * ZUGESAGTER Auftrag mit Vergütung. Offene und abgelehnte Anfragen zählen
 * nicht. Ob das Geld schon geflossen ist, wissen wir nicht.
 *
 * Zugeordnet wird nach dem Eventdatum, denn dann erbringt der Creator die
 * Leistung. Fehlt es, greift das Datum der Zusage, danach das des Versands.
 * Liegt das Event noch vor uns, ist der Betrag "erwartet", sonst "verdient".
 */

export interface EarningEntry {
  assignment: CreatorAssignment
  amount: number
  /** Datum, nach dem der Auftrag einem Monat zugeordnet wird. */
  date: Date | null
  /** Event vorbei: verdient. Sonst erwartet. */
  earned: boolean
}

export interface EarningsMonth {
  /** 'YYYY-MM' in lokaler Zeit, '' für Aufträge ohne jedes Datum. */
  key: string
  /** Erster Tag des Monats, null für den Sammeltopf ohne Datum. */
  monthStart: Date | null
  entries: EarningEntry[]
  earned: number
  upcoming: number
  total: number
}

export interface CreatorEarnings {
  /** Neuester Monat zuerst, der Topf ohne Datum ganz am Ende. */
  months: EarningsMonth[]
  totalEarned: number
  totalUpcoming: number
  /** Summe des laufenden Kalendermonats, verdient und erwartet zusammen. */
  currentMonthTotal: number
}

const validDate = (value: string): Date | null => {
  if (!value) return null
  const date = new Date(value)
  return isNaN(date.getTime()) ? null : date
}

const monthKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

/** Zählt dieser Auftrag als Einnahme? */
export function countsAsEarning(assignment: CreatorAssignment): boolean {
  return assignment.response === 'accepted' && assignment.compensation !== null && assignment.compensation >= 0
}

export function computeCreatorEarnings(assignments: CreatorAssignment[], now: Date = new Date()): CreatorEarnings {
  const byMonth = new Map<string, EarningsMonth>()

  for (const assignment of assignments) {
    if (!countsAsEarning(assignment)) continue

    const date =
      validDate(assignment.eventDate) ?? validDate(assignment.respondedAt) ?? validDate(assignment.sentAt)
    // Ohne Eventdatum lässt sich nicht sagen, ob die Leistung erbracht ist.
    // Dann zählt der Betrag als erwartet, nicht als verdient.
    const earned = assignment.eventDate ? isEventOver(null, assignment.eventDate) : false
    const amount = assignment.compensation as number
    const key = date ? monthKey(date) : ''

    let month = byMonth.get(key)
    if (!month) {
      month = {
        key,
        monthStart: date ? new Date(date.getFullYear(), date.getMonth(), 1) : null,
        entries: [],
        earned: 0,
        upcoming: 0,
        total: 0,
      }
      byMonth.set(key, month)
    }

    month.entries.push({ assignment, amount, date, earned })
    month.total += amount
    if (earned) month.earned += amount
    else month.upcoming += amount
  }

  const months = [...byMonth.values()].sort((a, b) => {
    if (!a.key) return 1
    if (!b.key) return -1
    return b.key.localeCompare(a.key)
  })

  for (const month of months) {
    month.entries.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
  }

  return {
    months,
    totalEarned: months.reduce((sum, month) => sum + month.earned, 0),
    totalUpcoming: months.reduce((sum, month) => sum + month.upcoming, 0),
    currentMonthTotal: byMonth.get(monthKey(now))?.total ?? 0,
  }
}
