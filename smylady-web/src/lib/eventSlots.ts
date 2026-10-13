import type { EventSlot } from '@/types'
import { formatScheduleDay, viennaWallClock } from '@/lib/eventSchedule'

/*
 * Freiwillige Zeitfenster beim Ticketkauf.
 *
 * Das Backend rechnet die Slots aus den Öffnungszeiten je Tag und
 * slotDurationMinutes (GET /events/:id/slots) und liefert Beginn und Ende als
 * UTC-Zeitpunkte. Angezeigt wird alles in Wiener Zeit — über viennaWallClock
 * aus eventSchedule.ts, nie über die Zeitzone des Geräts.
 */

/** Die festen Werte, die der Veranstalter wählen kann. */
export const SLOT_DURATION_OPTIONS = [15, 30, 60, 120] as const

const MINUTE_MS = 60 * 1000

/** Uhrzeit eines Zeitpunkts in Wien („18:00"), leer bei ungültigem Wert. */
export function slotTime(value: string | null | undefined): string {
  return viennaWallClock(value ?? undefined)?.time ?? ''
}

/**
 * Slots nach Öffnungstag gruppiert, in zeitlicher Reihenfolge.
 *
 * Gruppiert wird nach `date` aus der Antwort, dem Öffnungstag des Fensters:
 * Ein Slot um 01:00 aus einem Fenster, das um 22:00 beginnt, steht damit beim
 * Vortag — dort, wo der Käufer das Fenster in den Öffnungszeiten sieht.
 * Slots mit unbrauchbarem Beginn fallen weg.
 */
export function groupSlotsByDay(slots: EventSlot[]): { date: string; slots: EventSlot[] }[] {
  const valid = slots
    .map(slot => ({ slot, wall: viennaWallClock(slot.start) }))
    .filter((entry): entry is { slot: EventSlot; wall: NonNullable<typeof entry.wall> } => entry.wall !== null)
    .sort((a, b) => Date.parse(a.slot.start) - Date.parse(b.slot.start))

  const groups: { date: string; slots: EventSlot[] }[] = []
  for (const { slot, wall } of valid) {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(slot.date) ? slot.date : wall.date
    const group = groups.find(g => g.date === date)
    if (group) group.slots.push(slot)
    else groups.push({ date, slots: [slot] })
  }
  return groups
}

/**
 * „Fr, 16.10. 18:00–18:30" in Wiener Zeit. Ohne brauchbare Dauer (etwa weil
 * der Veranstalter die Zeitfenster inzwischen abgeschaltet hat) nur der
 * Beginn. null, wenn sich aus slotStart nichts machen lässt.
 */
export function formatSlot(
  slotStart: string | null | undefined,
  durationMinutes: number | null | undefined,
  locale: string,
): string | null {
  const start = viennaWallClock(slotStart ?? undefined)
  if (!start) return null

  const day = formatScheduleDay(start.date, locale)
  const minutes = Number(durationMinutes)
  if (!Number.isInteger(minutes) || minutes <= 0) return `${day} ${start.time}`

  const end = viennaWallClock(new Date(Date.parse(slotStart as string) + minutes * MINUTE_MS))
  return end ? `${day} ${start.time}–${end.time}` : `${day} ${start.time}`
}
