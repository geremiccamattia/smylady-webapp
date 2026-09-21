/**
 * Gemeinsame Datenbasis der Seite /events/business-events-wien.
 *
 * Hier liegt alles, was Server und Client teilen: die FAQ-Texte, die
 * Formatzuordnung, die Serien-Gruppierung und der serverseitige Abruf der
 * Events. Die Seite gibt strukturierte Daten serverseitig aus (page.tsx) und
 * rendert dieselben Inhalte im Client (views/BusinessEventsWien.tsx) — beide
 * müssen aus derselben Quelle lesen, sonst laufen sichtbarer Text und JSON-LD
 * auseinander.
 */

export type PageLocale = 'de' | 'en'

export interface BusinessEvent {
  _id?: string
  id?: string
  name?: string
  description?: string
  category?: string
  partyType?: string
  eventDate?: string | null
  eventStartTime?: string | null
  eventEndTime?: string | null
  locationName?: string
  price?: number
  soldOut?: boolean
  status?: string
  eventSeriesId?: string | null
  locationImages?: { url?: string }[]
  thumbnailUrl?: string | null
  userId?: { _id?: string; name?: string } | string | null
  creator?: { _id?: string; name?: string } | string | null
}

// ──────────────────────────────────────────────────────────────
// FAQ — eine Quelle für Accordion (Client) und FAQPage (Server)
// ──────────────────────────────────────────────────────────────

export interface FaqEntry {
  q: string
  a: string
}

export const FAQS: Record<PageLocale, FaqEntry[]> = {
  de: [
    {
      q: 'Was sind Business Events in Wien?',
      a: 'Business Events in Wien umfassen Networking-Veranstaltungen, Konferenzen, Workshops, Seminare und Meetups für Unternehmer, Führungskräfte und Professionals. Sie bieten die Möglichkeit, neue Kontakte zu knüpfen, Wissen zu erweitern und sich in der Wiener Business-Community zu vernetzen.',
    },
    {
      q: 'Wo finden Business Events in Wien statt?',
      a: 'Business Events in Wien finden an verschiedenen Locations statt – von Coworking Spaces und Hotels bis hin zu Konferenzzentren und Restaurants. Wien gilt als einer der führenden Business-Standorte Europas und bietet eine breite Auswahl an Veranstaltungsorten.',
    },
    {
      q: 'Gibt es kostenlose Business Events in Wien?',
      a: 'Ja, auf Share Your Party findest du sowohl kostenlose als auch kostenpflichtige Business Events in Wien. Viele Networking-Events und Meetups sind kostenlos zugänglich.',
    },
    {
      q: 'Wie finde ich Business Networking Events in Wien?',
      a: 'Auf Share Your Party kannst du gezielt nach Business Events in Wien suchen und filtern. Erstelle ein kostenloses Konto um keine Veranstaltung zu verpassen und Tickets direkt zu kaufen.',
    },
    {
      q: 'Wie kann ich ein Business Event in Wien auf Share Your Party erstellen?',
      a: 'Du kannst dein Business Event auf Share Your Party anlegen. Registriere dich auf shareyourparty.de, erstelle dein Event mit allen Details und erreiche direkt die Business Community in Wien.',
    },
  ],
  en: [
    {
      q: 'What are business events in Vienna?',
      a: 'Business events in Vienna include networking events, conferences, workshops, seminars, and meetups for entrepreneurs, executives, and professionals. They offer the opportunity to make new connections, expand your knowledge, and network within Vienna’s business community.',
    },
    {
      q: 'Where do business events in Vienna take place?',
      a: 'Business events in Vienna take place at various locations—from coworking spaces and hotels to conference centers and restaurants. Vienna is considered one of Europe’s leading business hubs and offers a wide selection of venues.',
    },
    {
      q: 'Are there free business events in Vienna?',
      a: 'Yes, on Share Your Party you’ll find both free and paid business events in Vienna. Many networking events and meetups are free to attend.',
    },
    {
      q: 'How do I find business networking events in Vienna?',
      a: 'On Share Your Party, you can search for and filter business events in Vienna. Create a free account so you don’t miss any events and can buy tickets directly.',
    },
    {
      q: 'How can I create a business event in Vienna on Share Your Party?',
      a: 'You can create your business event on Share Your Party. Register at shareyourparty.de, create your event with all the details, and reach the business community in Vienna directly.',
    },
  ],
}

// ──────────────────────────────────────────────────────────────
// Networking-Formate
// ──────────────────────────────────────────────────────────────

/**
 * Zuordnung Event → Format.
 *
 * Das Event-Modell kennt kein Feld „Format": `category` ist bei all diesen
 * Events 'Business', und `partyType` unterscheidet nur grob. Die Zuordnung
 * läuft deshalb über Schlüsselwörter im Namen und in der Beschreibung.
 *
 * Bewusst so und nicht über ein neues Datenfeld: Die Formate sind eine
 * redaktionelle Sicht für diese eine Landingpage, keine Eigenschaft, die
 * Veranstalter pflegen müssten. Ein Event kann mehreren Formaten zufallen —
 * `matchesFormat` entscheidet je Format eigenständig.
 *
 * Reihenfolge ist die Anzeigereihenfolge und bleibt wie abgestimmt.
 */
export interface NetworkingFormat {
  id: string
  /** Kleingeschriebene Schlüsselwörter, geprüft gegen Name und Beschreibung. */
  keywords: string[]
  heading: Record<PageLocale, string>
  description: Record<PageLocale, string>
  /**
   * Suchbegriff für eine gefilterte Eventansicht.
   *
   * Derzeit ungenutzt: Die Links unter den Formaten wurden auf Wunsch wieder
   * entfernt. Das Feld bleibt stehen, damit sie sich ohne erneute Zuordnung
   * wieder einhängen lassen.
   */
  searchTerm: string
}

export const NETWORKING_FORMATS: NetworkingFormat[] = [
  {
    id: 'breakfast',
    keywords: ['frühstück', 'fruehstueck', 'breakfast', 'lunch', 'mittag', 'brunch', 'morning'],
    heading: {
      de: 'Businessfrühstück & Business Lunch',
      en: 'Business Breakfast & Business Lunch',
    },
    description: {
      de: 'Networking am Morgen oder in der Mittagspause, meist 60 bis 90 Minuten und mit festem Ablauf. Die Runden sind klein, der Austausch ist konkret – ideal, wenn der Abend schon verplant ist. Viele dieser Termine finden wöchentlich oder monatlich statt.',
      en: 'Networking in the morning or over lunch, usually 60 to 90 minutes with a set structure. Groups stay small and conversations stay concrete — ideal when your evenings are already booked. Many of these run weekly or monthly.',
    },
    searchTerm: 'Businessfrühstück Wien',
  },
  {
    id: 'afterwork',
    keywords: ['afterwork', 'after work', 'feierabend', 'business clubbing', 'sundowner'],
    heading: {
      de: 'Afterwork & Business Clubbing',
      en: 'Afterwork & Business Clubbing',
    },
    description: {
      de: 'Der Übergang vom Arbeitstag in den Abend, in lockerer Runde und ohne Programmzwang. Gespräche entstehen hier nebenbei statt nach Plan. Gut geeignet, um eine Branche kennenzulernen, ohne sich auf ein ganzes Seminar festzulegen.',
      en: 'The transition from working day to evening, relaxed and without a rigid programme. Conversations happen on the side rather than on schedule. A good way to get a feel for an industry without committing to a full seminar.',
    },
    searchTerm: 'Afterwork Wien',
  },
  {
    id: 'speed-networking',
    keywords: ['speed networking', 'speed-networking', 'speeddating', 'speed dating', 'matching'],
    heading: {
      de: 'Speed Networking',
      en: 'Speed Networking',
    },
    description: {
      de: 'Kurze, getaktete Gespräche mit wechselnden Gegenübern – in einem Abend lernst du mehr Menschen kennen als auf drei losen Empfängen. Der Ablauf ist moderiert, niemand bleibt allein am Rand stehen. Besonders hilfreich, wenn du neu in einer Branche bist.',
      en: 'Short, timed conversations with changing partners — you meet more people in one evening than at three loose receptions. The format is hosted, so nobody is left standing alone. Especially useful when you are new to an industry.',
    },
    searchTerm: 'Speed Networking Wien',
  },
  {
    id: 'meetup',
    keywords: ['meetup', 'stammtisch', 'community', 'coworking', 'founders', 'startup', 'user group'],
    heading: {
      de: 'Branchen-Meetups & Stammtische',
      en: 'Industry Meetups & Regulars’ Tables',
    },
    description: {
      de: 'Wiederkehrende Treffen einer Fachgemeinschaft – Tech, Marketing, Gründung, Design. Der Kreis bleibt über die Termine hinweg ähnlich, dadurch entstehen echte Kontakte statt Visitenkartentausch. Der Einstieg ist meist kostenlos.',
      en: 'Recurring gatherings of a professional community — tech, marketing, founding, design. The circle stays largely the same across dates, which builds real contacts instead of business-card swaps. Entry is usually free.',
    },
    searchTerm: 'Meetup Wien',
  },
  {
    id: 'female-networking',
    keywords: ['female', 'women', 'frauen', 'ladies', 'she ', 'womxn'],
    heading: {
      de: 'Female Networking',
      en: 'Female Networking',
    },
    description: {
      de: 'Veranstaltungen von und für Frauen in Wirtschaft, Technik und Selbstständigkeit. Der Rahmen ist bewusst gesetzt: Sichtbarkeit, Mentoring und Austausch stehen im Vordergrund. Die Formate reichen vom Frühstück bis zur Podiumsdiskussion.',
      en: 'Events by and for women in business, tech and self-employment. The framing is deliberate: visibility, mentoring and exchange come first. Formats range from breakfasts to panel discussions.',
    },
    searchTerm: 'Female Networking Wien',
  },
  {
    id: 'conference',
    keywords: ['konferenz', 'conference', 'summit', 'kongress', 'symposium', 'forum', 'expo'],
    heading: {
      de: 'Konferenzen & Summits',
      en: 'Conferences & Summits',
    },
    description: {
      de: 'Ganztägige Veranstaltungen mit Vortragsprogramm, Ausstellern und längeren Pausen zum Netzwerken. Sie kosten mehr Zeit und meist auch Eintritt, bringen dafür aber Reichweite über die eigene Blase hinaus. Termine stehen oft Monate im Voraus fest.',
      en: 'Full-day events with a talk programme, exhibitors and longer breaks for networking. They cost more time and usually admission, but they reach well beyond your own bubble. Dates are often fixed months in advance.',
    },
    searchTerm: 'Konferenz Wien',
  },
]

/** Trifft dieses Event auf das Format zu? Geprüft wird Name und Beschreibung. */
export function matchesFormat(event: BusinessEvent, format: NetworkingFormat): boolean {
  const haystack = `${event.name ?? ''} ${event.description ?? ''}`.toLowerCase()
  return format.keywords.some(keyword => haystack.includes(keyword))
}

// ──────────────────────────────────────────────────────────────
// Serien-Gruppierung
// ──────────────────────────────────────────────────────────────

export interface EventSeriesGroup {
  /** Der nächste zukünftige Termin — diese Karte wird gerendert. */
  primary: BusinessEvent
  /** Alle Termine der Gruppe, aufsteigend sortiert, inklusive primary. */
  occurrences: BusinessEvent[]
}

function startTimestamp(event: BusinessEvent): number {
  for (const value of [event.eventStartTime, event.eventDate]) {
    if (!value) continue
    const time = new Date(value).getTime()
    if (!Number.isNaN(time)) return time
  }
  // Ohne brauchbaren Termin ans Ende sortieren statt auf 1970 zu fallen.
  return Number.MAX_SAFE_INTEGER
}

function organizerId(event: BusinessEvent): string {
  const raw = event.userId ?? event.creator
  if (!raw) return ''
  if (typeof raw === 'string') return raw
  return raw._id ?? ''
}

/**
 * Gruppierungsschlüssel einer Serie.
 *
 * Bevorzugt `eventSeriesId` aus dem Event-Modell. Fehlt sie — bei Altbeständen
 * und bei Serien, die als Einzelevents angelegt wurden —, greift ersatzweise
 * der normalisierte Name plus Veranstalter-ID. Der Ersatz ist bewusst eng
 * gefasst: Gleicher Name UND gleicher Veranstalter. Zwei verschiedene
 * Veranstalter mit derselben Bezeichnung bleiben dadurch getrennt.
 */
function seriesKey(event: BusinessEvent): string {
  if (event.eventSeriesId) return `series:${event.eventSeriesId}`

  const normalizedName = (event.name ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

  return `fallback:${normalizedName}|${organizerId(event)}`
}

/**
 * Fasst wiederkehrende Termine zu je einer Gruppe zusammen.
 *
 * Die Listenansicht zeigte bisher je Termin eine Karte — 17 Einträge für
 * faktisch 3 Veranstaltungen. Gerendert wird jetzt der nächste Termin je Serie,
 * die übrigen hängen als aufklappbare Liste darunter.
 */
export function groupEventsBySeries(events: BusinessEvent[]): EventSeriesGroup[] {
  const groups = new Map<string, BusinessEvent[]>()

  for (const event of events) {
    const key = seriesKey(event)
    const existing = groups.get(key)
    if (existing) existing.push(event)
    else groups.set(key, [event])
  }

  const result: EventSeriesGroup[] = []

  for (const occurrences of groups.values()) {
    const sorted = [...occurrences].sort((a, b) => startTimestamp(a) - startTimestamp(b))
    result.push({ primary: sorted[0], occurrences: sorted })
  }

  // Gruppen nach ihrem nächsten Termin sortieren, damit die Liste chronologisch bleibt.
  return result.sort((a, b) => startTimestamp(a.primary) - startTimestamp(b.primary))
}

// ──────────────────────────────────────────────────────────────
// Serverseitiger Abruf
// ──────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://app.shareyourparty.de'

/** Dieselben Parameter wie die Client-Abfrage in views/BusinessEventsWien.tsx. */
export const BUSINESS_EVENTS_QUERY = {
  latitude: '48.2092',
  longitude: '16.3728',
  radius: '30',
  category: 'Business',
  upcoming: 'true',
}

/**
 * Events für die strukturierten Daten.
 *
 * Muss serverseitig laufen: Das JSON-LD gehört ins initiale HTML, die
 * Client-Abfrage der Ansicht kommt dafür zu spät. Fehler werden geschluckt —
 * ohne Events entfällt die ItemList, die Seite bleibt bestehen.
 */
export async function fetchBusinessEventsWien(): Promise<BusinessEvent[]> {
  try {
    const params = new URLSearchParams(BUSINESS_EVENTS_QUERY)
    const response = await fetch(`${API_URL}/events/public?${params.toString()}`, {
      next: { revalidate: 3600 },
    })
    if (!response.ok) return []
    const json = await response.json()
    const data = json?.data
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('[business-events-wien] Abruf fehlgeschlagen:', error)
    return []
  }
}
