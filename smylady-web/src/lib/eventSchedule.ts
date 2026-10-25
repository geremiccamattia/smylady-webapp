import type { ApiEventScheduleEntry, EventScheduleEntry } from '@/types'

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
 *
 * Gesendet wird Wanduhrzeit, das Backend LIEFERT aber startAt/endAt als
 * UTC-Zeitpunkte. Alles, was einen gelesenen schedule entgegennimmt
 * (getScheduleStatus, groupScheduleByDay, dailyHoursFromSchedule), wandelt
 * ihn deshalb zuerst mit normalizeSchedule in Wanduhrzeit um. Zurück wird
 * nicht gewandelt — das Backend rechnet die Wanduhrzeit selbst um.
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

/*
 * dayNumber und toMinutes werfen nie: Ein fehlendes oder unpassendes Feld
 * ergibt NaN. Daran scheiterte die erste Fassung — `undefined.split` in einer
 * Sortierfunktion riss jede Seite mit Eventkacheln mit. NaN wird in
 * sortByStart aussortiert, bevor sortiert wird.
 */
function dayNumber(dateKey: string | undefined): number {
  if (typeof dateKey !== 'string' || !DATE_KEY.test(dateKey)) return NaN
  const [y, m, d] = dateKey.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / DAY_MS
}

function dateKeyFromDayNumber(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10)
}

function toMinutes(time: string | undefined): number {
  if (typeof time !== 'string' || !TIME.test(time)) return NaN
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
 *
 * `includeUntouched`: auch ohne Bearbeitung die sichtbaren Tageszeilen mit
 * ihren Vorgabewerten liefern. Gebraucht, sobald eine Slotdauer gewählt ist —
 * ohne schedule rechnet das Backend keine Slots, die Wahl wäre folgenlos.
 */
export function buildSchedule(
  days: string[],
  state: DailyHoursState,
  defaults: { startTime: string; endTime: string },
  options: { includeUntouched?: boolean } = {},
): EventScheduleEntry[] {
  if (!options.includeUntouched && !isDailyHoursEdited(days, state)) return []

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

/**
 * Was als schedule ankommen kann: die Antwortform des Backends (startAt/endAt)
 * oder Wanduhrzeit (startTime/endTime). Alle Felder optional, weil nichts
 * davon garantiert ist.
 */
export type ScheduleInput =
  | ReadonlyArray<(Partial<ApiEventScheduleEntry> & Partial<EventScheduleEntry>) | null | undefined>
  | null
  | undefined

function toWallClockEntry(
  item: Partial<ApiEventScheduleEntry> & Partial<EventScheduleEntry>,
): EventScheduleEntry | null {
  // Antwortform: UTC-Zeitpunkte nach Wien umrechnen.
  if (item.startAt !== undefined || item.endAt !== undefined) {
    const start = viennaWallClock(item.startAt)
    const end = viennaWallClock(item.endAt)
    if (!start || !end) return null
    return {
      // Aus startAt neu berechnet. Das gelieferte `date` wird hier nicht
      // gebraucht: Ohne gültiges startAt gibt es keine Startzeit, und der
      // Eintrag fällt ohnehin weg.
      date: start.date,
      startTime: start.time,
      endTime: end.time,
      ...(end.date !== start.date ? { endDate: end.date } : {}),
    }
  }

  // Wanduhrzeit: Hier ist das gelieferte `date` die einzige Quelle.
  if (item.date && item.startTime && item.endTime) {
    return {
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      ...(item.endDate && item.endDate !== item.date ? { endDate: item.endDate } : {}),
    }
  }
  return null
}

/**
 * Jeder gelesene schedule geht zuerst hierdurch — gleich, aus welchem Service
 * das Event kam. Ergebnis ist durchgehend Wanduhrzeit in Europe/Vienna.
 *
 * Einträge, aus denen sich kein gültiges Zeitfenster machen lässt (fehlendes
 * oder kaputtes Feld, Ende nicht nach Beginn), fallen einzeln weg. Ein
 * kaputter Eintrag kostet so eine Zeile Öffnungszeiten, nie die ganze Seite.
 */
export function normalizeSchedule(raw: ScheduleInput): EventScheduleEntry[] {
  if (!Array.isArray(raw)) return []

  const entries: EventScheduleEntry[] = []
  for (const item of raw) {
    const entry = item && typeof item === 'object' ? toWallClockEntry(item) : null
    if (!entry) continue
    const [start, end] = windowRange(entry)
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) entries.push(entry)
  }
  return entries
}

/** Umkehrung von buildSchedule: gespeicherten schedule ins Formular laden. */
export function dailyHoursFromSchedule(
  raw: ScheduleInput,
  days: string[],
): DailyHoursState {
  const schedule = normalizeSchedule(raw)
  if (schedule.length === 0) return {}

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

/**
 * Nach Beginn sortiert. Einträge mit NaN fallen VOR dem Sortieren weg — eine
 * Vergleichsfunktion, die NaN liefert, ergäbe eine beliebige Reihenfolge.
 */
function sortByStart(entries: EventScheduleEntry[]): EventScheduleEntry[] {
  return entries
    .map(entry => ({ entry, range: windowRange(entry) }))
    .filter(({ range }) => Number.isFinite(range[0]) && Number.isFinite(range[1]))
    .sort((a, b) => a.range[0] - b.range[0])
    .map(({ entry }) => entry)
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

const viennaFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: VIENNA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/**
 * Kalendertag und Uhrzeit eines beliebigen Zeitpunkts in Wien. Die Sommerzeit
 * kennt Intl — 16:00Z ist im Oktober 18:00, nach dem 25.10. 17:00.
 * null bei einem ungültigen Zeitpunkt.
 */
export function viennaWallClock(
  value: Date | string | undefined,
): { date: string; time: string; minutes: number } | null {
  if (value === undefined) return null
  const d = new Date(value)
  if (isNaN(d.getTime())) return null

  const parts = viennaFormat.formatToParts(d)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? '00'
  const time = `${get('hour')}:${get('minute')}`
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time,
    minutes: toMinutes(time),
  }
}

/** Versatz Wien gegenüber UTC zu einem Zeitpunkt, in Millisekunden. */
function viennaOffsetMs(instant: number): number {
  const wall = viennaWallClock(new Date(instant))
  if (!wall) return NaN
  const [y, m, d] = wall.date.split('-').map(Number)
  const [h, min] = wall.time.split(':').map(Number)
  const seconds = new Date(instant).getUTCSeconds()
  return Date.UTC(y, m - 1, d, h, min, seconds) - Math.floor(instant / 1000) * 1000
}

/**
 * Wiener Wanduhrzeit ("YYYY-MM-DD" + "HH:mm") → Zeitpunkt. Umkehrung von
 * viennaWallClock, nie über die Zeitzone des Geräts.
 *
 * Dasselbe Verfahren wie wallTimeToUtc im Backend (utils/event-calendar.ts):
 * zweimal den Versatz nachschlagen, damit auch die Umstellungstage stimmen.
 * Unbrauchbare Eingaben ergeben null.
 */
export function viennaWallTimeToUtc(dateKey: string, time: string): Date | null {
  if (!DATE_KEY.test(dateKey) || !TIME.test(time)) return null
  const [y, m, d] = dateKey.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  if (h > 23 || min > 59) return null
  const naive = Date.UTC(y, m - 1, d, h, min)
  const firstGuess = naive - viennaOffsetMs(naive)
  const result = new Date(naive - viennaOffsetMs(firstGuess))
  return isNaN(result.getTime()) ? null : result
}

/** Heutiger Kalendertag und Uhrzeit in Wien. */
export function viennaNow(now: Date): { date: string; minutes: number } {
  const wall = viennaWallClock(now)
  // `now` stammt immer aus new Date() und ist damit gültig.
  return { date: wall?.date ?? '', minutes: wall?.minutes ?? 0 }
}

/**
 * Datum eines Zeitpunkts als Kalendertag in Wien, nie in der Zeitzone des
 * Geräts. Die Form bestimmt der Aufrufer über `options` (wie bei
 * Intl.DateTimeFormat); hier wird nur die Zeitzone festgelegt. Leer bei
 * ungültigem Wert.
 *
 * Ein Event um 00:30 Wiener Zeit (22:30Z am Vortag) steht so auf jedem Gerät
 * am richtigen Tag — in New York sonst einen Tag früher.
 */
export function formatViennaDate(
  value: string | Date | undefined | null,
  locale: string,
  options: Intl.DateTimeFormatOptions = {},
): string {
  if (value === undefined || value === null) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: VIENNA_TIME_ZONE }).format(d)
}

/**
 * Zeitraum eines Events ohne Öffnungszeiten je Tag, in Wiener Zeit — aus
 * denselben Bausteinen wie die Öffnungszeiten und mit derselben Schreibweise:
 *
 *   mehrtägig: „Fr, 16.10. 18:00 – So, 18.10. 15:00"
 *   eintägig:  „18:00 – 20:00"
 *
 * Ob mehrtägig, entscheidet der Aufrufer (isMultiDayEvent aus lib/utils), damit
 * hier dieselbe Definition gilt wie im Rest der App. Ohne gültiges Ende nur die
 * Startzeit, ohne gültigen Beginn null.
 */
export function formatEventTimeRange(
  start: string | Date | undefined | null,
  end: string | Date | undefined | null,
  locale: string,
  multiDay: boolean,
): string | null {
  const from = viennaWallClock(start ?? undefined)
  if (!from) return null
  const to = viennaWallClock(end ?? undefined)
  if (!to) return multiDay ? `${formatScheduleDay(from.date, locale)} ${from.time}` : from.time
  return multiDay
    ? `${formatScheduleDay(from.date, locale)} ${from.time} – ${formatScheduleDay(to.date, locale)} ${to.time}`
    : `${from.time} – ${to.time}`
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
  raw: ScheduleInput,
  now: Date,
  maxDaysAhead = 6,
): ScheduleStatus {
  const entries = normalizeSchedule(raw)
  if (entries.length === 0) return null

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
  raw: ScheduleInput,
): { date: string; windows: EventScheduleEntry[] }[] {
  const sorted = sortByStart(normalizeSchedule(raw))
  if (sorted.length === 0) return []
  const days = listDays(sorted[0].date, sorted[sorted.length - 1].date)
  return days.map(date => ({ date, windows: sorted.filter(e => e.date === date) }))
}
