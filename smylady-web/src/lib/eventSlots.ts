import type { TFunction } from 'i18next'
import type { EventScheduleEntry, EventSlot } from '@/types'
import {
  formatScheduleDay,
  viennaWallClock,
  viennaWallTimeToUtc,
  VIENNA_TIME_ZONE,
  type ScheduleError,
} from '@/lib/eventSchedule'

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

/*
 * Grenzen der Slots — dieselben Werte wie im Backend
 * (smylady-backend, src/modules/event/event-slots.ts). Das Backend setzt sie
 * mit 400 durch; hier stehen sie nur, um vorher zu melden. Beim Ändern beide
 * Stellen anpassen.
 */
export const MIN_SLOT_DURATION_MINUTES = 5
export const MAX_SLOT_DURATION_MINUTES = 24 * 60
export const MAX_SLOTS_PER_EVENT = 5000

/** Brauchbare Slotdauer in Minuten — oder null, dann gibt es keine Slots. Wie im Backend. */
export function normalizeSlotDuration(value: unknown): number | null {
  // '' und null werden zu 0, undefined zu NaN — beides fällt unten heraus.
  const minutes = Number(value)
  if (!Number.isInteger(minutes)) return null
  if (minutes < MIN_SLOT_DURATION_MINUTES || minutes > MAX_SLOT_DURATION_MINUTES) return null
  return minutes
}

/**
 * Anzahl der Slots, die das Backend aus diesem schedule rechnen wird — dieselbe
 * Regel wie countSlots dort: je Öffnungsfenster floor(Länge / Dauer), die
 * Länge in echten Zeitpunkten. Deshalb wird die Wanduhrzeit hier wie im
 * Backend nach Wien umgerechnet; an den Umstellungstagen ist ein Fenster
 * 02:00–04:00 eine bzw. drei Stunden lang.
 */
export function countSlots(entries: EventScheduleEntry[], slotDurationMinutes: unknown): number {
  const minutes = normalizeSlotDuration(slotDurationMinutes)
  if (!minutes) return 0

  const durationMs = minutes * MINUTE_MS
  let count = 0
  for (const entry of entries) {
    const start = viennaWallTimeToUtc(entry.date, entry.startTime)
    const end = viennaWallTimeToUtc(entry.endDate ?? entry.date, entry.endTime)
    if (!start || !end) continue
    const length = end.getTime() - start.getTime()
    if (length >= durationMs) count += Math.floor(length / durationMs)
  }
  return count
}

/** Wie slotLimitMessage im Backend: zu viele Slots für diese Dauer, mit Grenze und Ist-Wert. */
export function slotLimitError(entries: EventScheduleEntry[], slotDurationMinutes: unknown): ScheduleError | null {
  const actual = countSlots(entries, slotDurationMinutes)
  return actual > MAX_SLOTS_PER_EVENT ? { code: 'tooManySlots', max: MAX_SLOTS_PER_EVENT, actual } : null
}

/** Uhrzeit eines Zeitpunkts in Wien („18:00"), leer bei ungültigem Wert. */
export function slotTime(value: string | null | undefined): string {
  return viennaWallClock(value ?? undefined)?.time ?? ''
}

/**
 * Knopfbeschriftungen für die Slots eines Öffnungstags, in derselben
 * Reihenfolge wie `slots`.
 *
 * Normalerweise nur die Wiener Startzeit („18:00"). Zeigen zwei oder mehr
 * Slots dieselbe Startzeit — in der wiederholten Stunde der Umstellung auf
 * Winterzeit, am 25.10.2026 zweimal „02:00" —, bekommen genau diese die
 * Zonenkurzform aus Intl angehängt („02:00 MESZ", „02:00 MEZ"), in der
 * Sprache der Seite. Alle anderen bleiben unverändert.
 */
export function slotButtonLabels(slots: EventSlot[], locale: string): string[] {
  const times = slots.map(slot => slotTime(slot.start))
  const count = new Map<string, number>()
  for (const time of times) count.set(time, (count.get(time) ?? 0) + 1)

  const zoneFormat = new Intl.DateTimeFormat(locale, { timeZone: VIENNA_TIME_ZONE, timeZoneName: 'short' })
  return slots.map((slot, i) => {
    const time = times[i]
    if ((count.get(time) ?? 0) < 2) return time
    const zone = zoneFormat.formatToParts(new Date(slot.start)).find(part => part.type === 'timeZoneName')?.value
    return zone ? `${time} ${zone}` : time
  })
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
 *
 * Zeigen Beginn und Ende dieselbe Wanduhrzeit, hängt die Dauer in Klammern
 * an: „So, 25.10. 02:00–02:00 (60 Minuten)". Das passiert in der wiederholten
 * Stunde der Umstellung auf Winterzeit — das Backend rechnet Slots in echten
 * Minuten, die Wanduhr springt zurück. Ohne Zusatz läse sich das wie ein Slot
 * ohne Dauer. Der Slot selbst bleibt unverändert und buchbar.
 */
export function formatSlot(
  slotStart: string | null | undefined,
  durationMinutes: number | null | undefined,
  locale: string,
  t: TFunction,
): string | null {
  const start = viennaWallClock(slotStart ?? undefined)
  if (!start) return null

  const day = formatScheduleDay(start.date, locale)
  const minutes = Number(durationMinutes)
  if (!Number.isInteger(minutes) || minutes <= 0) return `${day} ${start.time}`

  const end = viennaWallClock(new Date(Date.parse(slotStart as string) + minutes * MINUTE_MS))
  if (!end) return `${day} ${start.time}`

  const range = `${day} ${start.time}–${end.time}`
  if (end.time !== start.time) return range
  return `${range} (${t('timeslots.durationMinutes', { defaultValue: '{{count}} Minuten', count: minutes })})`
}
