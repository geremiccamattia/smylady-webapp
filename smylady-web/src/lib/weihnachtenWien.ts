/**
 * Datenbasis der Seite /events/weihnachtsmaerkte-wien.
 *
 * Aufbau wie bei Pop-up (lib/popupWien.ts) für den Abruf und wie bei Halloween
 * (lib/halloweenWien.ts) für den redaktionellen Teil — mit drei bewussten
 * Abweichungen:
 *
 *  1. Die Events werden serverseitig geholt UND serverseitig gerendert. Bei der
 *     Pop-up-Seite dienen sie auf dem Server nur dem JSON-LD, die Liste lädt
 *     erst im Client. Hier sollen sie im Quelltext stehen.
 *  2. Alle Texte stehen in de.json/en.json (Block christmasVienna), nicht in
 *     Konstanten. Sie werden über die Sprache der ROUTE gelesen, nicht über die
 *     i18n-Sprache des Browsers — sonst wäre das Server-HTML von /en deutsch
 *     (i18n steht beim Server-Rendering immer auf Deutsch).
 *  3. Nichts ist fest eingetragen, was sich aus den Events ergibt: Anzahl,
 *     Jahr, Zeiträume, früheste Öffnung, spätestes Ende, wer nach dem 24.12.
 *     offen hat, Stand der Daten.
 *
 * Alle Datums- und Zeitangaben entstehen hier, in Wiener Zeit über
 * Intl/viennaWallClock, nie in der Zeitzone des Geräts. Die View bekommt
 * fertige Zeichenketten und rendert nur.
 */

import de from '@/i18n/locales/de.json'
import en from '@/i18n/locales/en.json'
import { generateEventSlug } from '@/lib/utils'
import { stripMarkdown } from '@/lib/markdown'
import { parseNominatimAddress } from '@/lib/eventSchema'
import {
  addDays,
  listDays,
  normalizeSchedule,
  viennaWallClock,
} from '@/lib/eventSchedule'
import type { ApiEventScheduleEntry, EventScheduleEntry } from '@/types'
import {
  CHRISTMAS_GROUPS,
  CURATED_MARKETS,
  type ChristmasGroupId,
} from '@/lib/weihnachtenWienCuration'

export type PageLocale = 'de' | 'en'

export const PAGE_PATH = '/events/weihnachtsmaerkte-wien'

/** Der Kategoriewert im Backend (EventCategory.WEIHNACHTEN). Exakt so. */
export const CHRISTMAS_CATEGORY = 'Weihnachten'

/** Intl-Locale: Österreichisches Deutsch („Jänner"), britisches Englisch. */
const INTL_LOCALE: Record<PageLocale, string> = { de: 'de-AT', en: 'en-GB' }

// ──────────────────────────────────────────────────────────────
// Texte aus de.json / en.json
// ──────────────────────────────────────────────────────────────

const TEXTS: Record<PageLocale, unknown> = {
  de: (de as Record<string, unknown>).christmasVienna,
  en: (en as Record<string, unknown>).christmasVienna,
}

function lookup(locale: PageLocale, path: string): unknown {
  return path.split('.').reduce<unknown>(
    (node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined),
    TEXTS[locale],
  )
}

/**
 * Text aus christmasVienna.<path>, mit {{platzhaltern}}. Bei count === 0 bzw. 1
 * wird zuerst <path>_zero bzw. <path>_one versucht. Fehlt der Text, kommt der
 * Pfad zurück — sichtbar statt leer, damit eine Lücke auffällt.
 */
export function tx(locale: PageLocale, path: string, vars: Record<string, string | number> = {}): string {
  const suffix = vars.count === 0 ? '_zero' : vars.count === 1 ? '_one' : null
  const plural = suffix ? lookup(locale, `${path}${suffix}`) : undefined
  const raw = typeof plural === 'string' ? plural : lookup(locale, path)
  if (typeof raw !== 'string') return path
  return raw.replace(/\{\{(\w+)\}\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match))
}

/** Wie tx, aber null statt Pfad, wenn es den Text nicht gibt (für kuratierte Texte). */
function txOptional(locale: PageLocale, path: string): string | null {
  const raw = lookup(locale, path)
  return typeof raw === 'string' && raw.trim() !== '' ? raw : null
}

/** Liste von Texten (Tipps), [] wenn nicht vorhanden. */
function txList(locale: PageLocale, path: string): { title: string; text: string }[] {
  const raw = lookup(locale, path)
  return Array.isArray(raw)
    ? raw.filter((i): i is { title: string; text: string } => !!i && typeof i.title === 'string' && typeof i.text === 'string')
    : []
}

// ──────────────────────────────────────────────────────────────
// Eventabruf
// ──────────────────────────────────────────────────────────────

export interface ChristmasEvent {
  _id?: string
  id?: string
  name?: string
  description?: string
  category?: string
  eventDate?: string | null
  eventStartTime?: string | null
  eventEndTime?: string | null
  schedule?: ApiEventScheduleEntry[]
  locationName?: string
  price?: number
  ticketTiers?: { price?: number }[]
  soldOut?: boolean
  status?: string
  locationImages?: { url?: string }[]
  thumbnailUrl?: string | null
  updatedAt?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://app.shareyourparty.de'

/**
 * Wie bei Pop-up: upcoming=false, weil ein laufender Markt ein Startdatum in
 * der Vergangenheit hat; mit upcoming=true fiele genau der heraus. Mit false
 * begrenzt das Backend die Antwort nicht (limit 1000000) — die Seite enthält
 * also IMMER alle Events der Kategorie, auch neu angelegte.
 */
export const CHRISTMAS_EVENTS_QUERY = {
  latitude: '48.2092',
  longitude: '16.3728',
  radius: '30',
  category: CHRISTMAS_CATEGORY,
  upcoming: 'false',
}

/** Alle Events der Kategorie in Wien, roh. Fehler werden zu [] — die Seite bleibt bestehen. */
export async function fetchChristmasEventsWien(): Promise<ChristmasEvent[]> {
  try {
    const params = new URLSearchParams(CHRISTMAS_EVENTS_QUERY)
    const response = await fetch(`${API_URL}/events/public?${params.toString()}`, {
      next: { revalidate: 3600 },
    })
    if (!response.ok) return []
    const json = await response.json()
    return Array.isArray(json?.data) ? (json.data as ChristmasEvent[]) : []
  } catch (error) {
    console.error('[weihnachtsmaerkte-wien] Abruf fehlgeschlagen:', error)
    return []
  }
}

// ──────────────────────────────────────────────────────────────
// Kalendertage (Wien) und Formatierung
// ──────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000

function dayIndex(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / DAY_MS
}

/** Kalendertag formatieren — reiner Tag, deshalb in UTC; der Tag selbst stammt aus Wiener Zeit. */
function formatDay(key: string, locale: PageLocale, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { ...options, timeZone: 'UTC' }).format(new Date(dayIndex(key) * DAY_MS))
}

const SHORT_DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
const LONG_DATE: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }
const FULL_DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }

/** Wochentag 0 = Montag … 6 = Sonntag. */
function weekdayOf(key: string): number {
  return (new Date(dayIndex(key) * DAY_MS).getUTCDay() + 6) % 7
}

function weekdayName(index: number, locale: PageLocale): string {
  // 5. Jänner 2026 ist ein Montag — irgendeine Woche reicht für die Namen.
  return formatDay(`2026-01-${String(5 + index).padStart(2, '0')}`, locale, { weekday: 'short' }).replace(/\.$/, '')
}

/** „Mo–Fr", „Sa, So", „täglich". */
function weekdaySetLabel(days: number[], locale: PageLocale): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b)
  if (sorted.length === 7) return tx(locale, 'table.daily')
  const runs: number[][] = []
  for (const d of sorted) {
    const last = runs[runs.length - 1]
    if (last && d === last[last.length - 1] + 1) last.push(d)
    else runs.push([d])
  }
  return runs
    .map(run =>
      run.length >= 3
        ? `${weekdayName(run[0], locale)}–${weekdayName(run[run.length - 1], locale)}`
        : run.map(d => weekdayName(d, locale)).join(', '),
    )
    .join(', ')
}

// ──────────────────────────────────────────────────────────────
// Bezirk
// ──────────────────────────────────────────────────────────────

/** Die 23 Wiener Gemeindebezirke; Postleitzahl 1XX0 ↔ Bezirk XX. */
const VIENNA_DISTRICTS = [
  'Innere Stadt', 'Leopoldstadt', 'Landstraße', 'Wieden', 'Margareten', 'Mariahilf',
  'Neubau', 'Josefstadt', 'Alsergrund', 'Favoriten', 'Simmering', 'Meidling', 'Hietzing',
  'Penzing', 'Rudolfsheim-Fünfhaus', 'Ottakring', 'Hernals', 'Währing', 'Döbling',
  'Brigittenau', 'Floridsdorf', 'Donaustadt', 'Liesing',
]

/**
 * Bezirk aus dem Nominatim-Text: zuerst über die Postleitzahl, sonst über den
 * Bezirksnamen. Bei mehreren Namen zählt der letzte — Nominatim nennt Grätzl
 * und Katastralgemeinde vor dem Bezirk.
 */
function districtOf(locationName?: string): number | null {
  if (!locationName) return null
  const postal = /\b1(\d{2})0\b/.exec(locationName)
  if (postal) {
    const n = Number(postal[1])
    if (n >= 1 && n <= 23) return n
  }
  const parts = locationName.split('—')[0].split(',').map(p => p.trim())
  for (let i = parts.length - 1; i >= 0; i--) {
    const index = VIENNA_DISTRICTS.indexOf(parts[i])
    if (index >= 0) return index + 1
  }
  return null
}

function districtLabel(n: number | null, locale: PageLocale): string {
  if (n === null) return '–'
  return tx(locale, 'table.district', { number: n, name: VIENNA_DISTRICTS[n - 1] })
}

// ──────────────────────────────────────────────────────────────
// Ein Markt
// ──────────────────────────────────────────────────────────────

export interface MarketModel {
  id: string
  name: string
  /** Relativer Pfad zur Eventseite, ohne Sprachpräfix. */
  path: string
  district: string
  venue: string
  startKey: string
  endKey: string
  periodLabel: string
  /** Leer, wenn der Veranstalter keine Öffnungszeiten je Tag eingetragen hat. */
  hoursLines: string[]
  transit: string | null
  group: ChristmasGroupId | null
  text: string
  badges: string[]
  free: boolean
  /** Öffnungstage nach dem 24.12. (0 = keiner). */
  daysAfterXmas: number
  lastDayLabel: string
  image: string | null
  /** Für das JSON-LD. */
  schema: {
    startIso: string
    endIso: string | null
    streetAddress?: string
    postalCode?: string
    description?: string
    image?: string
  }
}

function eventId(event: ChristmasEvent): string {
  return String(event._id || event.id || '')
}

function isoOrNull(value?: string | null): string | null {
  if (!value || /^\d{1,2}:\d{2}$/.test(String(value).trim())) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** Erster und letzter Öffnungstag (Wien) sowie die Fenster, falls vorhanden. */
function periodOf(event: ChristmasEvent): { startKey: string; endKey: string; windows: EventScheduleEntry[] } | null {
  const windows = normalizeSchedule(event.schedule)
  if (windows.length > 0) {
    const dates = windows.map(w => w.date).sort()
    return { startKey: dates[0], endKey: dates[dates.length - 1], windows }
  }
  const start = viennaWallClock(event.eventStartTime || event.eventDate || undefined)
  if (!start) return null
  const end = viennaWallClock(event.eventEndTime || undefined)
  return { startKey: start.date, endKey: end && end.date >= start.date ? end.date : start.date, windows: [] }
}

/**
 * Öffnungszeiten als Zeilen. Jeder Wochentag gehört zu dem Zeitfenster, das er
 * am häufigsten hat — ein Feiertag (8.12.) oder der 24.12. macht aus einem
 * Dienstag also keinen zweiten Eintrag. Höchstens drei Zeilen; alle Tage, die
 * davon abweichen, laufen als „abweichend an n Tagen" mit.
 */
function hoursLinesOf(windows: EventScheduleEntry[], locale: PageLocale): string[] {
  if (windows.length === 0) return []
  // Zeitfenster je Kalendertag (bei mehreren Fenstern am Tag zusammengefasst).
  const rangeByDate = new Map<string, string>()
  for (const w of windows) {
    const range = `${w.startTime}–${w.endTime}`
    const prev = rangeByDate.get(w.date)
    rangeByDate.set(w.date, prev ? `${prev}, ${range}` : range)
  }
  const totals = new Map<string, number>()
  for (const range of rangeByDate.values()) totals.set(range, (totals.get(range) ?? 0) + 1)

  // Je Wochentag das häufigste Fenster; bei Gleichstand das insgesamt häufigere.
  const dominant = new Map<number, string>()
  for (let wd = 0; wd < 7; wd++) {
    const counts = new Map<string, number>()
    for (const [date, range] of rangeByDate) if (weekdayOf(date) === wd) counts.set(range, (counts.get(range) ?? 0) + 1)
    const best = [...counts.entries()].sort((a, b) => b[1] - a[1] || (totals.get(b[0]) ?? 0) - (totals.get(a[0]) ?? 0))[0]
    if (best) dominant.set(wd, best[0])
  }

  const shown = [...totals.keys()]
    .sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0))
    .map(range => ({ range, weekdays: [...dominant].filter(([, r]) => r === range).map(([wd]) => wd) }))
    .filter(line => line.weekdays.length > 0)
    .slice(0, 3)
  const shownRange = new Map<number, string>(shown.flatMap(line => line.weekdays.map(wd => [wd, line.range] as [number, string])))
  const lines = shown.map(line => `${weekdaySetLabel(line.weekdays, locale)} ${line.range}`)
  const otherDays = [...rangeByDate].filter(([date, range]) => shownRange.get(weekdayOf(date)) !== range).length
  if (otherDays > 0) lines.push(tx(locale, 'table.otherDays', { count: otherDays }))
  return lines
}

function isFree(event: ChristmasEvent): boolean {
  const tiers = event.ticketTiers ?? []
  return (event.price ?? 0) === 0 && tiers.every(t => (t.price ?? 0) === 0)
}

function venueOf(locationName?: string): string {
  return (locationName || '').split('—')[0].split(' Top ')[0].split(',')[0].trim() || '–'
}

function excerpt(description?: string, max = 220): string {
  const text = stripMarkdown(description) || ''
  if (text.length <= max) return text
  return `${text.slice(0, text.lastIndexOf(' ', max)).trim()} …`
}

function buildMarket(event: ChristmasEvent, locale: PageLocale): MarketModel | null {
  const id = eventId(event)
  const period = periodOf(event)
  if (!id || !event.name || !period) return null

  const curated = CURATED_MARKETS[id]
  const group = curated && (CHRISTMAS_GROUPS as readonly string[]).includes(curated.group) ? curated.group : null
  const xmasKey = `${period.startKey.slice(0, 4)}-12-24`
  const daysAfterXmas = period.windows.length > 0
    ? new Set(period.windows.map(w => w.date).filter(d => d > xmasKey)).size
    : period.endKey > xmasKey ? listDays(addDays(xmasKey, 1), period.endKey).length : 0

  const free = isFree(event)
  const badges = [
    ...(free ? [tx(locale, 'badges.free')] : []),
    ...(daysAfterXmas > 0 ? [tx(locale, 'badges.afterChristmas')] : []),
    ...(group ? (curated.badges ?? []).map(b => tx(locale, `badges.${b}`)) : []),
  ]

  const address = parseNominatimAddress(event.locationName)
  const districtNo = districtOf(event.locationName)
  const firstWindow = period.windows[0]
  const lastWindow = period.windows[period.windows.length - 1]
  const startIso = firstWindow
    ? isoOrNull(event.schedule?.find(s => s.date === firstWindow.date)?.startAt) ?? isoOrNull(event.eventStartTime)
    : isoOrNull(event.eventStartTime) ?? isoOrNull(event.eventDate)
  const endIso = lastWindow
    ? isoOrNull([...(event.schedule ?? [])].reverse().find(s => s.date === lastWindow.date)?.endAt) ?? isoOrNull(event.eventEndTime)
    : isoOrNull(event.eventEndTime)
  if (!startIso) return null

  const image = event.locationImages?.[0]?.url || event.thumbnailUrl || null
  const description = stripMarkdown(event.description) || undefined

  return {
    id,
    name: event.name,
    path: `/event/${generateEventSlug(event.name, id)}`,
    district: districtLabel(districtNo, locale),
    venue: venueOf(event.locationName),
    startKey: period.startKey,
    endKey: period.endKey,
    periodLabel: `${formatDay(period.startKey, locale, SHORT_DATE)} – ${formatDay(period.endKey, locale, SHORT_DATE)}`,
    hoursLines: hoursLinesOf(period.windows, locale),
    transit: group ? txOptional(locale, `curated.${id}.transit`) : null,
    group,
    text: (group && txOptional(locale, `curated.${id}.text`)) || excerpt(event.description),
    badges,
    free,
    daysAfterXmas,
    lastDayLabel: formatDay(period.endKey, locale, LONG_DATE),
    image,
    schema: {
      startIso,
      endIso: endIso && endIso > startIso ? endIso : null,
      streetAddress: address.streetAddress,
      postalCode: address.postalCode || (districtNo ? String(1000 + districtNo * 10) : undefined),
      description,
      image: image || undefined,
    },
  }
}

// ──────────────────────────────────────────────────────────────
// Die ganze Seite
// ──────────────────────────────────────────────────────────────

export interface PageModel {
  locale: PageLocale
  year: number
  count: number
  headline: string
  intro: string[]
  updated: string | null
  markets: MarketModel[]
  /** Gruppen mit mindestens einem Markt, in fester Reihenfolge. */
  groups: { id: ChristmasGroupId; title: string; intro: string; markets: MarketModel[] }[]
  /** Märkte ohne Kuratierung — Sammelsektion am Ende. */
  uncurated: MarketModel[]
  timeline: {
    months: { label: string; offsetPct: number }[]
    xmasOffsetPct: number | null
    rows: { id: string; name: string; group: ChristmasGroupId | null; offsetPct: number; widthPct: number; label: string }[]
  } | null
  afterXmas: MarketModel[]
  faqs: { q: string; a: string }[]
  tips: { title: string; text: string }[]
}

/** Laufende und kommende Märkte: letzter Öffnungstag heute oder später (Wien). */
export function selectCurrent(events: ChristmasEvent[], now: Date = new Date()): ChristmasEvent[] {
  const today = viennaWallClock(now)?.date ?? ''
  return events.filter(event => {
    const period = periodOf(event)
    return !!period && period.endKey >= today
  })
}

/** „A, B und C" — Intl.ListFormat kennt die TS-Lib des Projekts nicht. */
function joinNames(names: string[], locale: PageLocale): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} ${tx(locale, 'listAnd')} ${names[names.length - 1]}`
}

export function buildPageModel(events: ChristmasEvent[], locale: PageLocale, now: Date = new Date()): PageModel {
  const markets = selectCurrent(events, now)
    .map(event => buildMarket(event, locale))
    .filter((m): m is MarketModel => m !== null)
    .sort((a, b) => a.startKey.localeCompare(b.startKey) || a.name.localeCompare(b.name, INTL_LOCALE[locale]))

  const count = markets.length
  const todayKey = viennaWallClock(now)?.date ?? '2026-01-01'
  const year = Number((markets[0]?.startKey ?? todayKey).slice(0, 4))

  // Stand: die jüngste Änderung an einem der Events.
  const latestUpdate = events
    .map(e => (e.updatedAt ? new Date(e.updatedAt).getTime() : NaN))
    .filter(t => !Number.isNaN(t))
    .sort((a, b) => b - a)[0]
  const updatedKey = latestUpdate ? viennaWallClock(new Date(latestUpdate))?.date : null
  const updated = updatedKey
    ? tx(locale, 'updated', { date: formatDay(updatedKey, locale, FULL_DATE), count })
    : null

  const groups = CHRISTMAS_GROUPS
    .map(id => ({
      id,
      title: tx(locale, `groups.${id}.title`),
      intro: tx(locale, `groups.${id}.intro`),
      markets: markets.filter(m => m.group === id),
    }))
    .filter(g => g.markets.length > 0)
  const uncurated = markets.filter(m => m.group === null)

  // Zeitleiste über die ganze Saison.
  let timeline: PageModel['timeline'] = null
  if (count > 0) {
    const seasonStart = markets.map(m => m.startKey).sort()[0]
    const seasonEnd = markets.map(m => m.endKey).sort().reverse()[0]
    const total = dayIndex(seasonEnd) - dayIndex(seasonStart) + 1
    const pct = (key: string) => ((dayIndex(key) - dayIndex(seasonStart)) / total) * 100
    const months = listDays(seasonStart, seasonEnd)
      .filter((key, i) => i === 0 || key.endsWith('-01'))
      .map(key => ({ label: formatDay(key, locale, { month: 'short' }), offsetPct: pct(key) }))
    const xmasKey = `${year}-12-24`
    timeline = {
      months,
      xmasOffsetPct: xmasKey >= seasonStart && xmasKey <= seasonEnd ? pct(xmasKey) + 50 / total : null,
      rows: markets.map(m => ({
        id: m.id,
        name: m.name,
        group: m.group,
        offsetPct: pct(m.startKey),
        widthPct: ((dayIndex(m.endKey) - dayIndex(m.startKey) + 1) / total) * 100,
        label: m.periodLabel,
      })),
    }
  }

  const afterXmas = markets
    .filter(m => m.daysAfterXmas > 0)
    .sort((a, b) => b.endKey.localeCompare(a.endKey))

  // Einleitung mit Zeitraum aus den Daten.
  const first = markets[0]
  const lastEnd = [...markets].sort((a, b) => b.endKey.localeCompare(a.endKey))[0]
  const intro = count > 0
    ? [
        tx(locale, 'intro.season', {
          from: formatDay(first.startKey, locale, LONG_DATE),
          to: formatDay(lastEnd.endKey, locale, LONG_DATE),
          count,
        }),
        tx(locale, 'intro.about'),
      ]
    : [tx(locale, 'intro.empty')]

  // FAQ: Antworten aus den Daten, wo möglich.
  const faqs: { q: string; a: string }[] = []
  if (count > 0) {
    const openingFirst = markets.filter(m => m.startKey === first.startKey).map(m => m.name)
    const latestStart = [...markets].sort((a, b) => b.startKey.localeCompare(a.startKey))[0]
    faqs.push({
      q: tx(locale, 'faq.opening.q', { year }),
      a: tx(locale, 'faq.opening.a', {
        date: formatDay(first.startKey, locale, LONG_DATE),
        names: joinNames(openingFirst, locale),
        lastOpening: formatDay(latestStart.startKey, locale, LONG_DATE),
        count,
      }),
    })
    const closingLast = markets.filter(m => m.endKey === lastEnd.endKey).map(m => m.name)
    const endCounts = new Map<string, number>()
    for (const m of markets) endCounts.set(m.endKey, (endCounts.get(m.endKey) ?? 0) + 1)
    const commonEnd = [...endCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]
    faqs.push({
      q: tx(locale, 'faq.closing.q'),
      a: tx(locale, 'faq.closing.a', {
        names: joinNames(closingLast, locale),
        date: formatDay(lastEnd.endKey, locale, LONG_DATE),
        commonEnd: formatDay(commonEnd, locale, LONG_DATE),
      }),
    })
    faqs.push({
      q: tx(locale, 'faq.afterChristmas.q'),
      a: afterXmas.length > 0
        ? tx(locale, 'faq.afterChristmas.a', {
            names: joinNames(afterXmas.map(m => `${m.name} (${formatDay(m.endKey, locale, SHORT_DATE)})`), locale),
          })
        : tx(locale, 'faq.afterChristmas.none'),
    })
    const freeCount = markets.filter(m => m.free).length
    faqs.push({
      q: tx(locale, 'faq.entry.q'),
      a: tx(locale, freeCount === count ? 'faq.entry.all' : freeCount === 0 ? 'faq.entry.none' : 'faq.entry.some', {
        free: freeCount,
        count,
      }),
    })
  }
  faqs.push({ q: tx(locale, 'faq.transport.q'), a: tx(locale, 'faq.transport.a') })

  return {
    locale,
    year,
    count,
    headline: tx(locale, 'headline', { year, count }),
    intro,
    updated,
    markets,
    groups,
    uncurated,
    timeline,
    afterXmas,
    faqs,
    tips: txList(locale, 'tips.items'),
  }
}
