import { isPaidOut, type CreatorAssignment } from '@/services/creator'
import { isEventOver } from '@/lib/utils'

/**
 * Einnahmen eines Creators, aus seinen Aufträgen berechnet.
 *
 * "Einnahme" heisst: eine ZUGESAGTE, GEBUCHTE Anfrage mit Vergütung — die
 * Brand hat bezahlt. Eine Zusage in der Verfügbarkeitsanfrage zählt noch
 * nicht (die Brand hat noch nicht gebucht), offene und abgelehnte Anfragen
 * und stornierte Aufträge auch nicht.
 *
 * Zugeordnet wird nach dem Eventdatum, denn dann erbringt der Creator die
 * Leistung. Fehlt es, greift das Datum der Buchung, der Zusage, des Versands.
 *
 * Drei Töpfe: "ausgezahlt" (wir haben die Vergütung überwiesen), "offen"
 * (Event vorbei, Auszahlung steht aus) und "erwartet" (Event steht bevor).
 */

export interface EarningEntry {
  assignment: CreatorAssignment
  amount: number
  /** Datum, nach dem der Auftrag einem Monat zugeordnet wird. */
  date: Date | null
  /** Event vorbei (oder schon ausgezahlt): verdient. Sonst erwartet. */
  earned: boolean
  /** Die Vergütung ist beim Creator angekommen. */
  paid: boolean
}

export interface EarningsMonth {
  /** 'YYYY-MM' in lokaler Zeit, '' für Aufträge ohne jedes Datum. */
  key: string
  /** Erster Tag des Monats, null für den Sammeltopf ohne Datum. */
  monthStart: Date | null
  entries: EarningEntry[]
  earned: number
  upcoming: number
  paid: number
  total: number
}

export interface CreatorEarnings {
  /** Neuester Monat zuerst, der Topf ohne Datum ganz am Ende. */
  months: EarningsMonth[]
  totalEarned: number
  totalUpcoming: number
  /** Davon schon ausgezahlt bzw. noch offen (verdient, aber nicht ausgezahlt). */
  totalPaid: number
  totalOpen: number
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
  return (
    assignment.response === 'accepted' &&
    assignment.phase === 'booked' &&
    assignment.orderStatus !== 'cancelled' &&
    assignment.compensation !== null &&
    assignment.compensation >= 0
  )
}

export function computeCreatorEarnings(assignments: CreatorAssignment[], now: Date = new Date()): CreatorEarnings {
  const byMonth = new Map<string, EarningsMonth>()

  for (const assignment of assignments) {
    if (!countsAsEarning(assignment)) continue

    const date =
      validDate(assignment.eventDate) ??
      validDate(assignment.bookedAt) ??
      validDate(assignment.respondedAt) ??
      validDate(assignment.sentAt)
    const paid = isPaidOut(assignment)
    // Ohne Eventdatum lässt sich nicht sagen, ob die Leistung erbracht ist.
    // Dann zählt der Betrag als erwartet — ausser er ist schon ausgezahlt.
    const earned = paid || (assignment.eventDate ? isEventOver(null, assignment.eventDate) : false)
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
        paid: 0,
        total: 0,
      }
      byMonth.set(key, month)
    }

    month.entries.push({ assignment, amount, date, earned, paid })
    month.total += amount
    if (earned) month.earned += amount
    else month.upcoming += amount
    if (paid) month.paid += amount
  }

  const months = [...byMonth.values()].sort((a, b) => {
    if (!a.key) return 1
    if (!b.key) return -1
    return b.key.localeCompare(a.key)
  })

  for (const month of months) {
    month.entries.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
  }

  const totalEarned = months.reduce((sum, month) => sum + month.earned, 0)
  const totalPaid = months.reduce((sum, month) => sum + month.paid, 0)

  return {
    months,
    totalEarned,
    totalUpcoming: months.reduce((sum, month) => sum + month.upcoming, 0),
    totalPaid,
    totalOpen: totalEarned - totalPaid,
    currentMonthTotal: byMonth.get(monthKey(now))?.total ?? 0,
  }
}
