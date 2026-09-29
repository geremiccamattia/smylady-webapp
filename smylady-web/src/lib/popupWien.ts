/**
 * Gemeinsame Datenbasis der Seite /events/pop-up-wien.
 *
 * Aufgebaut wie lib/businessEventsWien.ts: Hier liegt alles, was Server und
 * Client teilen — Texte, FAQ, Formatsektionen und der serverseitige Abruf. Die
 * Seite gibt strukturierte Daten serverseitig aus (page.tsx) und rendert
 * dieselben Inhalte im Client (views/PopupWien.tsx). Beide lesen aus dieser
 * Datei, sonst laufen sichtbarer Text und JSON-LD auseinander.
 *
 * Die deutschen Texte stammen wörtlich aus der redaktionellen Vorlage
 * (kategorieseite-pop-up-wien.md) und sind bewusst nicht umformuliert.
 */

export type PageLocale = 'de' | 'en'

type Localized<T> = Record<PageLocale, T>

export const PAGE_PATH = '/events/pop-up-wien'

/** Die App-Kategorie hinter dieser Seite. In der Datenbank ohne Bindestrich. */
export const POPUP_CATEGORY = 'Popup'

export interface PopupEvent {
  _id?: string
  id?: string
  name?: string
  description?: string
  category?: string
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
// Seitenkopf
// ──────────────────────────────────────────────────────────────

/**
 * Title und Description.
 *
 * Der Title nimmt die Jahreszahl als Parameter, statt sie einzubauen: Sie kommt
 * aus generateMetadata() und damit aus dem Datum des Renderlaufs — hartkodiert
 * stünde zum Jahreswechsel eine veraltete Zahl im Snippet.
 *
 * Ohne " | Share Your Party": Den Brand hängt das Template im Root-Layout an.
 */
export const SEO: Localized<{ title: (year: number) => string; description: string }> = {
  de: {
    title: year => `Pop-up Stores & Events in Wien ${year} – Alle Termine`,
    description:
      'Alle aktuellen Pop-ups in Wien: Pop-up Stores, Brand-Pop-ups, Design-Märkte und Pop-up Lokale. Termine, Öffnungszeiten und Tickets – laufend aktualisiert.',
  },
  en: {
    title: year => `Pop-up Stores & Events in Vienna ${year} – All Dates`,
    description:
      'All current pop-ups in Vienna: pop-up stores, brand pop-ups, design markets and pop-up restaurants. Dates, opening hours and tickets – updated continuously.',
  },
}

export const HEADLINE: Localized<string> = {
  de: 'Pop-up Stores & Pop-up Events in Wien',
  en: 'Pop-up Stores & Pop-up Events in Vienna',
}

/** Sichtbarer Breadcrumb im Seitenkopf — Vorlage für das BreadcrumbList-Schema. */
export const BREADCRUMB: Localized<{ country: string; city: string; page: string }> = {
  de: { country: 'Österreich', city: 'Wien', page: 'Pop-up' },
  en: { country: 'Austria', city: 'Vienna', page: 'Pop-up' },
}

/**
 * Intro unter der H1.
 *
 * `{link}` markiert die Stelle, an der die Ansicht einen internen Link
 * einsetzt — siehe INTRO_LINK. Der Text selbst bleibt dadurch ein
 * zusammenhängender Satz und muss nicht in Fragmente zerlegt gepflegt werden.
 */
export const INTRO: Localized<string> = {
  de: 'Pop-ups sind da und wieder weg, bevor man davon gehört hat. Auf dieser Seite findest du alle aktuellen Pop-up Stores, Brand-Pop-ups, Design-Märkte und Pop-up Lokale in {link} – mit Zeitraum, Adresse und, wo nötig, Tickets. Neue Pop-ups kommen laufend dazu, ein Blick vor dem Wochenende lohnt sich also.',
  en: 'Pop-ups come and go before you have even heard of them. On this page you will find all current pop-up stores, brand pop-ups, design markets and pop-up restaurants in {link} – with dates, addresses and, where needed, tickets. New pop-ups are added continuously, so a look before the weekend is worth it.',
}

export const INTRO_LINK: { href: string; label: Localized<string> } = {
  href: '/events/wien',
  label: { de: 'Wien', en: 'Vienna' },
}

export const LIST_HEADING: Localized<string> = {
  de: 'Aktuelle Pop-ups in Wien',
  en: 'Current pop-ups in Vienna',
}

export const LIST_EMPTY: Localized<string> = {
  de: 'Aktuell sind keine Pop-ups in Wien eingetragen.',
  en: 'There are currently no pop-ups listed in Vienna.',
}

// ──────────────────────────────────────────────────────────────
// Formatsektionen
// ──────────────────────────────────────────────────────────────

export interface PopupFormat {
  id: string
  heading: Localized<string>
  /** Fließtext; `{link}` wird durch `link` ersetzt, falls gesetzt. */
  body: Localized<string>
  link?: { href: string; label: Localized<string> }
}

export const FORMATS_HEADING: Localized<string> = {
  de: 'Welche Pop-ups gibt es in Wien?',
  en: 'What kinds of pop-ups are there in Vienna?',
}

/**
 * Die vier Formate aus der Vorlage, in deren Reihenfolge.
 *
 * Anders als die Networking-Formate auf der Business-Seite hängen diese nicht
 * an einer Schlüsselwortsuche über die Events: Sie sind reine Texterklärung und
 * stehen unter der Liste. Eine Zuordnung Event → Format gäbe es im Datenmodell
 * auch nicht, alle Events tragen schlicht die Kategorie „Popup".
 */
export const FORMATS: PopupFormat[] = [
  {
    id: 'stores',
    heading: {
      de: 'Pop-up Stores & Brand-Pop-ups',
      en: 'Pop-up Stores & Brand Pop-ups',
    },
    body: {
      de: 'Marken mieten für ein paar Tage eine Fläche, zeigen eine neue Kollektion oder ein neues Produkt und sind danach wieder weg. Oft gibt es Goodie Bags, limitierte Editionen oder Aktionen, die es sonst nirgends gibt. Der Eintritt ist fast immer frei, bei bekannten Marken lohnt es sich trotzdem, früh da zu sein.',
      en: 'Brands rent a space for a few days, show a new collection or a new product and are gone again afterwards. There are often goodie bags, limited editions or promotions you will not find anywhere else. Admission is almost always free, but with well-known brands it still pays to arrive early.',
    },
  },
  {
    id: 'gastro',
    heading: {
      de: 'Pop-up Lokale & Gastro',
      en: 'Pop-up Restaurants & Food',
    },
    body: {
      de: 'Küchen auf Zeit: Ein Koch oder ein Kollektiv übernimmt für ein paar Wochen ein Lokal, eine Bar oder einen Hinterhof. Von Supper Clubs über Streetfood bis zu Sommerlokalen, die nur bei Schönwetter aufsperren. Hier lohnt sich eine Reservierung, weil die Plätze begrenzt sind.',
      en: 'Kitchens on borrowed time: a cook or a collective takes over a restaurant, a bar or a backyard for a few weeks. From supper clubs and street food to summer spots that only open in good weather. A reservation pays off here, because seats are limited.',
    },
  },
  {
    id: 'markets',
    /*
     * Der Workshops-Link sitzt auf „Designerinnen". Die Vorlage bietet in
     * diesem Absatz kein Wort, das direkt auf Workshops zeigt — verlinkt wird
     * deshalb der Begriff, der dem Machen am nächsten kommt, ohne den Text zu
     * ändern. Redaktionell einen Blick wert.
     */
    heading: {
      de: 'Design-, Vintage- & Kreativmärkte',
      en: 'Design, Vintage & Creative Markets',
    },
    body: {
      de: 'Temporäre Märkte, auf denen lokale Labels, {link} und Vintage-Händler direkt verkaufen. Meist an einem Wochenende, oft mit DJ, Drinks und Foodständen – näher an einem Event als an einem Einkauf.',
      en: 'Temporary markets where local labels, {link} and vintage dealers sell directly. Usually over a single weekend, often with a DJ, drinks and food stalls – closer to an event than to shopping.',
    },
    link: {
      href: '/events/workshops-wien',
      label: { de: 'Designerinnen', en: 'designers' },
    },
  },
  {
    id: 'parties',
    heading: {
      de: 'Pop-up Partys & Clubs an ungewöhnlichen Orten',
      en: 'Pop-up Parties & Clubs in Unusual Places',
    },
    body: {
      de: 'Die Nachtversion des Prinzips: eine {link} in einer Halle, einem Rohbau, einem Einkaufszentrum oder einer Brauerei, einmalig und ohne feste Location. Genau dort passieren oft die Nächte, über die danach am meisten geredet wird.',
      en: 'The night-time version of the principle: a {link} in a warehouse, a building shell, a shopping centre or a brewery, one time only and without a fixed venue. That is often exactly where the nights happen that everyone talks about afterwards.',
    },
    link: {
      href: '/events/clubbing-wien',
      label: { de: 'Party', en: 'party' },
    },
  },
]

// ──────────────────────────────────────────────────────────────
// FAQ — eine Quelle für Accordion (Client) und FAQPage (Server)
// ──────────────────────────────────────────────────────────────

export interface FaqEntry {
  q: string
  a: string
}

export const FAQ_HEADING: Localized<string> = {
  de: 'Häufige Fragen zu Pop-ups in Wien',
  en: 'Frequently asked questions about pop-ups in Vienna',
}

export const FAQS: Localized<FaqEntry[]> = {
  de: [
    {
      q: 'Was ist ein Pop-up Store?',
      a: 'Ein Pop-up Store ist ein Geschäft auf Zeit. Eine Marke, ein Label oder ein Lokal mietet eine Fläche für wenige Tage bis einige Wochen, statt sich langfristig einzumieten. Danach verschwindet der Store wieder.',
    },
    {
      q: 'Wo finde ich aktuell Pop-ups in Wien?',
      a: 'Alle Pop-ups, die gerade laufen oder demnächst aufsperren, findest du oben auf dieser Seite. Häufige Standorte sind die Einkaufsstraßen der Innenstadt, Neubau und Mariahilf sowie Zwischennutzungen in leerstehenden Geschäftslokalen.',
    },
    {
      q: 'Kosten Pop-ups Eintritt?',
      a: 'Pop-up Stores und Brand-Pop-ups sind in der Regel kostenlos zugänglich. Bei Pop-up Lokalen, Dinner-Formaten und Pop-up Partys gibt es dagegen oft Tickets oder eine Reservierungspflicht – das steht bei jedem Event dabei.',
    },
    {
      q: 'Wie lange bleibt ein Pop-up offen?',
      a: 'Das reicht von einem einzigen Wochenende bis zu mehreren Monaten. Weil der Zeitraum so unterschiedlich ist, steht bei jedem Eintrag dabei, bis wann du hingehen kannst.',
    },
    {
      q: 'Wie trage ich mein eigenes Pop-up ein?',
      a: 'Du legst dein Pop-up kostenlos als Event auf Share Your Party an, mit Zeitraum, Adresse und Fotos. Es erscheint dann automatisch auf dieser Seite und in der App.',
    },
  ],
  en: [
    {
      q: 'What is a pop-up store?',
      a: 'A pop-up store is a shop on borrowed time. A brand, a label or a restaurant rents a space for a few days up to a few weeks instead of signing a long-term lease. Afterwards the store disappears again.',
    },
    {
      q: 'Where do I find current pop-ups in Vienna?',
      a: 'All pop-ups that are running right now or opening soon are listed at the top of this page. Common locations are the shopping streets of the city centre, Neubau and Mariahilf, as well as interim uses of vacant retail spaces.',
    },
    {
      q: 'Do pop-ups charge admission?',
      a: 'Pop-up stores and brand pop-ups are usually free to enter. Pop-up restaurants, dinner formats and pop-up parties, on the other hand, often require tickets or a reservation – this is stated with each event.',
    },
    {
      q: 'How long does a pop-up stay open?',
      a: 'That ranges from a single weekend to several months. Because the period varies so much, every entry states how long you can go.',
    },
    {
      q: 'How do I list my own pop-up?',
      a: 'You create your pop-up as an event on Share Your Party for free, with its dates, address and photos. It then appears automatically on this page and in the app.',
    },
  ],
}

// ──────────────────────────────────────────────────────────────
// Abschluss-CTA
// ──────────────────────────────────────────────────────────────

export const CTA: Localized<{
  heading: string
  body: string
  buttonLabel: string
}> = {
  de: {
    heading: 'Du planst ein Pop-up in Wien?',
    body: 'Ob Store, Lokal, Markt oder Party: Trag dein Pop-up kostenlos auf Share Your Party ein und erreiche damit direkt die Wiener Community. Mit Ticketing, wenn du es brauchst – und ohne, wenn nicht.',
    buttonLabel: 'Pop-up eintragen',
  },
  en: {
    heading: 'Are you planning a pop-up in Vienna?',
    body: 'Whether store, restaurant, market or party: list your pop-up on Share Your Party for free and reach Vienna’s community directly. With ticketing if you need it – and without if you do not.',
    buttonLabel: 'List your pop-up',
  },
}

export const CTA_HREF = '/veranstalter'

// ──────────────────────────────────────────────────────────────
// Eventabruf
// ──────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://app.shareyourparty.de'

/**
 * Abfrageparameter für Server und Client.
 *
 * `upcoming` fehlt hier bewusst und wird auf `false` gesetzt: Ein Pop-up, das
 * am 1.10. begonnen hat und bis zum 12.10. läuft, hat ein Startdatum in der
 * Vergangenheit. Mit `upcoming=true` fiele genau das aus der Liste, was gerade
 * offen hat — für eine Pop-up-Seite der wichtigste Fall überhaupt. Aussortiert
 * wird deshalb erst hinterher über selectRunningAndUpcoming().
 */
export const POPUP_EVENTS_QUERY = {
  latitude: '48.2092',
  longitude: '16.3728',
  radius: '30',
  category: POPUP_CATEGORY,
}

function startTimestamp(event: PopupEvent): number {
  for (const value of [event.eventStartTime, event.eventDate]) {
    if (!value) continue
    const time = new Date(value).getTime()
    if (!Number.isNaN(time)) return time
  }
  // Ohne brauchbaren Termin ans Ende sortieren statt auf 1970 zu fallen.
  return Number.MAX_SAFE_INTEGER
}

/** Endzeitpunkt, sofern brauchbar. „19:00" ohne Datum zählt nicht. */
function endTimestamp(event: PopupEvent): number | null {
  const value = event.eventEndTime
  if (!value || /^\d{1,2}:\d{2}$/.test(String(value).trim())) return null
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? null : time
}

/**
 * Laufende und kommende Pop-ups, chronologisch.
 *
 * Ein Pop-up gilt als vorbei, sobald sein Enddatum überschritten ist. Fehlt ein
 * Enddatum, entscheidet das Startdatum — dann verhält sich der Eintrag wie ein
 * gewöhnliches Event. Bewusst nicht über den `upcoming`-Parameter der API, der
 * nur das Startdatum kennt und laufende Pop-ups damit verschluckt.
 */
export function selectRunningAndUpcoming(
  events: PopupEvent[],
  now: Date = new Date(),
): PopupEvent[] {
  const nowMs = now.getTime()
  // Der laufende Tag zählt noch dazu, auch wenn das Ende auf Mitternacht fiel.
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

  return events
    .filter(event => {
      const end = endTimestamp(event)
      if (end !== null) return end >= cutoff
      return startTimestamp(event) >= cutoff
    })
    .sort((a, b) => startTimestamp(a) - startTimestamp(b))
}

/**
 * Events für die strukturierten Daten.
 *
 * Muss serverseitig laufen: Das JSON-LD gehört ins initiale HTML, die
 * Client-Abfrage der Ansicht kommt dafür zu spät. Fehler werden geschluckt —
 * ohne Events entfällt die ItemList, die Seite bleibt bestehen.
 */
export async function fetchPopupEventsWien(): Promise<PopupEvent[]> {
  try {
    const params = new URLSearchParams({ ...POPUP_EVENTS_QUERY, upcoming: 'false' })
    const response = await fetch(`${API_URL}/events/public?${params.toString()}`, {
      next: { revalidate: 3600 },
    })
    if (!response.ok) return []
    const json = await response.json()
    const data = json?.data
    return Array.isArray(data) ? selectRunningAndUpcoming(data) : []
  } catch (error) {
    console.error('[pop-up-wien] Abruf fehlgeschlagen:', error)
    return []
  }
}
