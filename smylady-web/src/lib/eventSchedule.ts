import type { EventScheduleEntry } from '@/types'

/*
 * Öffnungszeiten je Tag für mehrtägige Events.
 *
 * Alles hier rechnet mit Kalendertagen als Strings (YYYY-MM-DD) und Uhrzeiten
 * als HH:mm — genau so, wie das Backend `schedule` erwartet und zurückgibt.
 * Kein `new Date('2026-11-06')` und kein setHours: Das eine ist UTC, das andere
 * die Zeitzone des Geräts, und beides verschiebt Tage. Für die Arithmetik
 * werden Kalendertage auf eine fortlaufende Tagesnummer abgebildet (Date.UTC),
 * dort gibt es weder Zeitzonen noch Sommerzeit.
 *
 * „Jetzt" und „heute" kommen ausschließlich aus Europe/Vienna, damit ein
 * Besucher mit anders gestellter Uhr dieselbe Anzeige sieht.
 */

export const MAX_SCHEDULE_ENTRIES = 60
export const VIENNA_TIME_ZONE = 'Europe/Vienna'

/** Ein Zeitfenster, wie es das Formular bearbeitet. */
export interface DailyHoursWindow {
  startTime: string
  endTime: string
  /** „endet am Folgetag" — vom Veranstalter gesetzt. */
  nextDay: boolean
}

export interface DailyHoursDay {
  closed: boolean
  windows: DailyHoursWindow[]
}

/**
 * Bearbeitungsstand je Kalendertag. Leer heißt: niemand hat einen Tag
 * angefasst, es wird kein schedule gesendet.
 */
export type DailyHoursState = Record<string, DailyHoursDay>

export type ScheduleError = 'missingTime' | 'overlap' | 'tooMany' | 'allClosed'

const DAY_MS = 24 * 60 * 60 * 1000
const MINUTES_PER_DAY = 24 * 60
/** Schutz vor Endlosschleifen bei vertippten Jahreszahlen. */
const MAX_LISTED_DAYS = 366

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^\d{1,2}:\d{2}$/

function dayNumber(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / DAY_MS
}

function dateKeyFromDayNumber(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10)
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function addDays(dateKey: string, days: number): string {
  return dateKeyFromDayNumber(dayNumber(dateKey) + days)
}

/**
 * Kalendertag eines Zeitpunkts in der Zeitzone des Geräts.
 *
 * Ersetzt `toISOString().split('T')[0]`, das den UTC-Tag liefert: Ein Ende um
 * 00:30 Wiener Zeit lag dort auf dem Vortag. Bewusst die Gerätezeitzone und
 * nicht Wien, denn die Formulare lesen die Uhrzeit mit getHours() und senden
 * mit setHours() — Datum und Uhrzeit müssen aus derselben Zone stammen.
 */
export function localDateKey(value: string | Date): string {
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Alle Kalendertage von start bis end, beide eingeschlossen. */
export function listDays(startKey: string, endKey: string): string[] {
  if (!DATE_KEY.test(startKey) || !DATE_KEY.test(endKey)) return []
  const first = dayNumber(startKey)
  const last = dayNumber(endKey)
  if (last < first || last - first >= MAX_LISTED_DAYS) return []
  const days: string[] = []
  for (let day = first; day <= last; day++) days.push(dateKeyFromDayNumber(day))
  return days
}

/** Ein Ende vor oder gleich dem Beginn geht zwingend über Mitternacht. */
export function isForcedNextDay(window: Pick<DailyHoursWindow, 'startTime' | 'endTime'>): boolean {
  return (
    TIME.test(window.startTime) &&
    TIME.test(window.endTime) &&
    toMinutes(window.endTime) <= toMinutes(window.startTime)
  )
}

export function endsNextDay(window: DailyHoursWindow): boolean {
  return window.nextDay || isForcedNextDay(window)
}

export function defaultDay(defaults: { startTime: string; endTime: string }): DailyHoursDay {
  return {
    closed: false,
    windows: [{ startTime: defaults.startTime, endTime: defaults.endTime, nextDay: false }],
  }
}

/** Wurde mindestens einer der angezeigten Tage bearbeitet? */
export function isDailyHoursEdited(days: string[], state: DailyHoursState): boolean {
  return days.some(day => day in state)
}

/**
 * Der zu sendende schedule. Leer, solange kein angezeigter Tag bearbeitet
 * wurde. Danach übernehmen unberührte Tage die Vorgabe aus dem Hauptformular,
 * geschlossene Tage fehlen.
 */
export function buildSchedule(
  days: string[],
  state: DailyHoursState,
  defaults: { startTime: string; endTime: string },
): EventScheduleEntry[] {
  if (!isDailyHoursEdited(days, state)) return []

  const entries: EventScheduleEntry[] = []
  for (const date of days) {
    const day = state[date] ?? defaultDay(defaults)
    if (day.closed) continue
    for (const window of day.windows) {
      entries.push({
        date,
        startTime: window.startTime,
        endTime: window.endTime,
        ...(endsNextDay(window) ? { endDate: addDays(date, 1) } : {}),
      })
    }
  }
  return entries
}

/** Umkehrung von buildSchedule: gespeicherten schedule ins Formular laden. */
export function dailyHoursFromSchedule(
  schedule: EventScheduleEntry[] | undefined,
  days: string[],
): DailyHoursState {
  if (!schedule?.length) return {}

  const state: DailyHoursState = {}
  for (const entry of schedule) {
    const day = (state[entry.date] ??= { closed: false, windows: [] })
    day.windows.push({
      startTime: entry.startTime,
      endTime: entry.endTime,
      nextDay: !!entry.endDate && entry.endDate !== entry.date,
    })
  }
  // Tage im Zeitraum ohne Eintrag waren geschlossen — sonst bekämen sie beim
  // nächsten Speichern stillschweigend die Vorgabezeiten.
  for (const date of days) {
    if (!(date in state)) state[date] = { closed: true, windows: [] }
  }
  return state
}

/** Beginn und Ende eines Fensters als Minuten auf der fortlaufenden Tagesachse. */
function windowRange(entry: EventScheduleEntry): [number, number] {
  const start = dayNumber(entry.date) * MINUTES_PER_DAY + toMinutes(entry.startTime)
  const end = dayNumber(entry.endDate ?? entry.date) * MINUTES_PER_DAY + toMinutes(entry.endTime)
  return [start, end]
}

function sortByStart(entries: EventScheduleEntry[]): EventScheduleEntry[] {
  return [...entries].sort((a, b) => windowRange(a)[0] - windowRange(b)[0])
}

/** Dieselben Regeln, die das Backend mit 400 durchsetzt — vorher melden statt danach. */
export function validateSchedule(entries: EventScheduleEntry[]): ScheduleError | null {
  if (entries.length === 0) return 'allClosed'
  if (entries.some(e => !TIME.test(e.startTime) || !TIME.test(e.endTime))) return 'missingTime'
  if (entries.length > MAX_SCHEDULE_ENTRIES) return 'tooMany'

  const sorted = sortByStart(entries)
  for (let i = 1; i < sorted.length; i++) {
    if (windowRange(sorted[i])[0] < windowRange(sorted[i - 1])[1]) return 'overlap'
  }
  return null
}

/** Erster Beginn und letztes Ende — das, was das Backend als Eventzeitraum ableitet. */
export function scheduleBounds(
  entries: EventScheduleEntry[],
): { startDate: string; startTime: string; endDate: string; endTime: string } | null {
  const valid = entries.filter(e => TIME.test(e.startTime) && TIME.test(e.endTime))
  if (valid.length === 0) return null

  const sorted = sortByStart(valid)
  const first = sorted[0]
  const last = valid.reduce((a, b) => (windowRange(b)[1] > windowRange(a)[1] ? b : a))
  return {
    startDate: first.date,
    startTime: first.startTime,
    endDate: last.endDate ?? last.date,
    endTime: last.endTime,
  }
}

/** Kurzer Wochentag ohne Punkt: „Fr", „Fri". */
export function formatWeekdayShort(dateKey: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' })
    .format(new Date(dayNumber(dateKey) * DAY_MS))
    .replace(/\.$/, '')
}

/** „Fr, 06.11." */
export function formatScheduleDay(dateKey: string, locale: string): string {
  const [, m, d] = dateKey.split('-')
  return `${formatWeekdayShort(dateKey, locale)}, ${d}.${m}.`
}

/** Heutiger Kalendertag und Uhrzeit in Wien. */
export function viennaNow(now: Date): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIENNA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? '00'
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  }
}

export type ScheduleStatus =
  | { kind: 'today'; startTime: string; endTime: string }
  | { kind: 'next'; date: string; startTime: string }
  | null

/**
 * Was die Kachel zeigt.
 *
 * - „today": ein Fenster läuft gerade oder kommt heute noch. Ein Fenster vom
 *   Vortag, das über Mitternacht noch läuft, zählt ebenfalls als heute offen.
 *   Ist das heutige Fenster schon vorbei, gilt der Tag als geschlossen.
 * - „next": nächster Öffnungstag, aber nur innerhalb von `maxDaysAhead` Tagen.
 *   Weiter entfernt wäre „Ab Fr" mehrdeutig.
 * - null: nichts davon — die Kachel zeigt das Bisherige.
 */
export function getScheduleStatus(
  entries: EventScheduleEntry[] | undefined,
  now: Date,
  maxDaysAhead = 6,
): ScheduleStatus {
  if (!entries?.length) return null

  const today = viennaNow(now)
  const nowMinute = dayNumber(today.date) * MINUTES_PER_DAY + today.minutes
  const sorted = sortByStart(entries)

  const todayWindow = sorted.find(entry => {
    const [start, end] = windowRange(entry)
    return end > nowMinute && (entry.date === today.date || start <= nowMinute)
  })
  if (todayWindow) {
    return { kind: 'today', startTime: todayWindow.startTime, endTime: todayWindow.endTime }
  }

  const next = sorted.find(entry => windowRange(entry)[0] > nowMinute)
  if (!next || dayNumber(next.date) - dayNumber(today.date) > maxDaysAhead) return null
  return { kind: 'next', date: next.date, startTime: next.startTime }
}

/**
 * Für die Detailseite: alle Tage vom ersten bis zum letzten Öffnungstag, auch
 * die geschlossenen dazwischen, je Tag die Fenster in zeitlicher Reihenfolge.
 */
export function groupScheduleByDay(
  entries: EventScheduleEntry[],
): { date: string; windows: EventScheduleEntry[] }[] {
  if (entries.length === 0) return []
  const sorted = sortByStart(entries)
  const days = listDays(sorted[0].date, sorted[sorted.length - 1].date)
  return days.map(date => ({ date, windows: sorted.filter(e => e.date === date) }))
}
