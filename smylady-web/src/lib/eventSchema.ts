import { canonicalUrl, type Locale } from '@/lib/seo'
import { generateEventSlug } from '@/lib/utils'
import { stripMarkdown } from '@/lib/markdown'
import { safeExternalUrl } from '@/lib/safeUrl'

/**
 * Strukturierte Daten nach schema.org/Event für die Event-Detailseite.
 *
 * Wird SERVERSEITIG in der page.tsx ausgegeben, nicht per useEffect aus einer
 * Client-Komponente. Google rendert JavaScript, die meisten KI-Crawler nicht —
 * genau daran ist die Grounding-Seite vorher gescheitert.
 *
 * Leitlinie durchgehend: lieber ein Feld weglassen als es raten. Ein falsches
 * Datum oder eine erfundene Adresse in den strukturierten Daten richtet mehr
 * Schaden an als eine Lücke.
 */

/** Die Felder, die hier gelesen werden. Die API ist untypisiert, deshalb alles optional. */
export interface EventForSchema {
  _id?: string
  name?: string
  description?: string
  eventDate?: string | null
  eventStartTime?: string | null
  eventEndTime?: string | null
  locationName?: string
  locationType?: string
  onlineUrl?: string
  location?: { type?: string; coordinates?: number[] } | null
  locationImages?: { url?: string }[]
  thumbnailUrl?: string | null
  price?: number
  soldOut?: boolean
  status?: string
  paymentType?: string
  createdAt?: string
  ticketTiers?: { _id?: string; name?: string; price?: number; quantity?: number | null; soldCount?: number }[]
  userId?: { _id?: string; name?: string } | string | null
  creator?: { _id?: string; name?: string } | string | null
}

const HOUSE_NUMBER_PATTERN = /^\d{1,4}\s*[a-zA-Z]?(?:\s*[-/]\s*\d{1,4}\s*[a-zA-Z]?)?$/
const POSTAL_CODE_PATTERN = /^\d{4,5}$/

const COUNTRY_CODES: Record<string, string> = {
  österreich: 'AT',
  osterreich: 'AT',
  austria: 'AT',
  // Vereinzelt liefert Nominatim türkisch lokalisierte Namen — ein solcher
  // Datensatz steht in der Produktionsdatenbank ("Viyana, Avusturya").
  avusturya: 'AT',
  deutschland: 'DE',
  germany: 'DE',
  schweiz: 'CH',
  switzerland: 'CH',
}

/**
 * Namen, die ein Bundesland bezeichnen und NIE eine Stadt.
 *
 * Nominatim listet vor der Postleitzahl das Bundesland, sobald es sich vom Ort
 * unterscheidet: "… Jakomini, Graz, Steiermark, 8010, Österreich". Ohne diese
 * Liste würde daraus "Steiermark" als Stadt.
 *
 * Wien, Salzburg, Berlin, Hamburg und Bremen stehen bewusst NICHT darin: Sie
 * sind beides, und in Wien fällt der Eintrag ohnehin zusammen ("… Wien, 1020").
 * Sie zu überspringen würde dort den Bezirk zur Stadt machen.
 */
const STATE_ONLY_NAMES = new Set([
  'steiermark', 'kärnten', 'tirol', 'oberösterreich', 'niederösterreich',
  'vorarlberg', 'burgenland',
  'bayern', 'hessen', 'sachsen', 'sachsen-anhalt', 'thüringen', 'brandenburg',
  'nordrhein-westfalen', 'rheinland-pfalz', 'saarland', 'schleswig-holstein',
  'mecklenburg-vorpommern', 'baden-württemberg',
])

export interface ParsedAddress {
  venueName?: string
  streetAddress?: string
  postalCode?: string
  addressLocality?: string
  addressCountry?: string
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Hängt die Hausnummer an die Straße — außer sie steht schon darin.
 *
 * Nominatim liefert die Nummer teils doppelt: In
 * "REAKTOR, 40, Geblergasse 40, …" steht sie sowohl als eigener Abschnitt als
 * auch bereits in der Straße. Ohne diese Prüfung entstünde "Geblergasse 40 40".
 */
function joinStreet(street: string, houseNumber: string): string {
  const trimmed = street.trim()
  if (new RegExp(`\\s${escapeRegExp(houseNumber.trim())}$`).test(trimmed)) return trimmed
  return `${trimmed} ${houseNumber.trim()}`
}

/**
 * Zerlegt Nominatims `display_name` in die Bestandteile einer PostalAddress.
 *
 * Beispiel:
 *   "Flucc, 5, Praterstern, Jägerzeile, Leopoldstadt, Katastralgemeinde
 *    Leopoldstadt, Leopoldstadt, Wien, 1020, Österreich"
 *   → venueName "Flucc", streetAddress "Praterstern 5", postalCode "1020",
 *     addressLocality "Wien", addressCountry "AT"
 *
 * Die Stadt wird über die Position VOR der Postleitzahl bestimmt, nicht über
 * eine Namensliste: "Leopoldstadt" kommt in diesem Beispiel dreimal vor, "Wien"
 * nur an der richtigen Stelle.
 *
 * `streetAddress` entsteht NUR, wenn eine Hausnummer erkannt wurde. Ohne sie
 * stünde dort sonst der nächstbeste Abschnitt — bei
 * "Herrmannpark, Katastralgemeinde Landstraße, …" also eine
 * Katastralgemeinde, die keine Straße ist.
 */
export function parseNominatimAddress(locationName?: string): ParsedAddress {
  if (!locationName) return {}

  // "Wien, Österreich — Standort folgt" → der Zusatz gehört nicht in die Adresse.
  const withoutSuffix = locationName.split('—')[0]
  const parts = withoutSuffix.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return {}

  const result: ParsedAddress = {}

  const countryCode = COUNTRY_CODES[parts[parts.length - 1].toLowerCase()]
  if (countryCode) {
    result.addressCountry = countryCode
    parts.pop()
  }

  const postalIndex = parts.findIndex((p) => POSTAL_CODE_PATTERN.test(p))
  if (postalIndex > 0) {
    result.postalCode = parts[postalIndex]
    let localityIndex = postalIndex - 1
    while (localityIndex > 0 && STATE_ONLY_NAMES.has(parts[localityIndex].toLowerCase())) {
      localityIndex--
    }
    result.addressLocality = parts[localityIndex]
    parts.splice(localityIndex, postalIndex - localityIndex + 1)
  } else if (parts.length > 0) {
    // Ohne Postleitzahl ist der letzte verbliebene Abschnitt die Stadt
    // ("Wien, Österreich" → "Wien").
    result.addressLocality = parts[parts.length - 1]
    if (parts.length > 1) parts.pop()
  }

  if (parts.length >= 2 && HOUSE_NUMBER_PATTERN.test(parts[0])) {
    result.streetAddress = joinStreet(parts[1], parts[0])
  } else if (parts.length >= 3 && HOUSE_NUMBER_PATTERN.test(parts[1])) {
    result.venueName = parts[0]
    result.streetAddress = joinStreet(parts[2], parts[1])
  } else if (parts.length >= 1 && !HOUSE_NUMBER_PATTERN.test(parts[0])) {
    result.venueName = parts[0]
  }

  return result
}

/**
 * Ein gültiger ISO-8601-Zeitpunkt oder null.
 *
 * Zeitfelder liegen in dieser Codebasis teils als ISO-String, teils als blankes
 * "HH:mm" vor (siehe isEventOver in lib/utils.ts). `new Date("19:00")` ergibt
 * Invalid Date — wahr, aber unbrauchbar. Ein blanker Uhrzeitwert wird deshalb
 * ausdrücklich verworfen, statt sich auf die Date-Prüfung zu verlassen.
 */
function toIsoOrNull(value?: string | null): string | null {
  if (!value) return null
  if (typeof value === 'string' && /^\d{1,2}:\d{2}$/.test(value.trim())) return null
  const date = new Date(value)
  if (isNaN(date.getTime())) return null
  return date.toISOString()
}

function coordinates(event: EventForSchema): { lat: number; lng: number } | null {
  const lng = event.location?.coordinates?.[0]
  const lat = event.location?.coordinates?.[1]
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  // [0, 0] ist der Default eines nicht gesetzten GeoJSON-Punkts und läge im Atlantik.
  if (lat === 0 && lng === 0) return null
  return { lat, lng }
}

function organizerOf(event: EventForSchema): { _id?: string; name?: string } | null {
  const raw = event.userId ?? event.creator
  if (!raw || typeof raw !== 'object') return null
  if (!raw.name) return null
  return raw
}

type JsonLdObject = Record<string, unknown>

function buildLocation(event: EventForSchema, eventUrl: string): JsonLdObject {
  const address = parseNominatimAddress(event.locationName)

  if (event.locationType === 'online') {
    // Ohne brauchbare onlineUrl die Eventseite: VirtualLocation verlangt eine URL.
    return {
      '@type': 'VirtualLocation',
      url: safeExternalUrl(event.onlineUrl) || eventUrl,
    }
  }

  const postalAddress: JsonLdObject = { '@type': 'PostalAddress' }
  if (address.addressLocality) postalAddress.addressLocality = address.addressLocality
  if (address.addressCountry) postalAddress.addressCountry = address.addressCountry

  if (event.locationType === 'tba') {
    /*
     * "Standort folgt": Nur die Stadt ist belegt. Kein streetAddress, und
     * bewusst auch kein geo — die Hälfte dieser Events trägt [0, 0], die andere
     * Stadtkoordinaten, die eine Genauigkeit vortäuschen würden, die es nicht
     * gibt. `location` ist Pflichtfeld, ganz weglassen geht also nicht.
     */
    return {
      '@type': 'Place',
      name: address.addressLocality || event.locationName || 'Standort folgt',
      address: postalAddress,
    }
  }

  if (address.streetAddress) postalAddress.streetAddress = address.streetAddress
  if (address.postalCode) postalAddress.postalCode = address.postalCode

  const place: JsonLdObject = {
    '@type': 'Place',
    name: address.venueName || address.addressLocality || event.locationName || '',
    address: postalAddress,
  }

  const geo = coordinates(event)
  if (geo) {
    place.geo = { '@type': 'GeoCoordinates', latitude: geo.lat, longitude: geo.lng }
  }

  return place
}

function buildOffers(
  event: EventForSchema,
  eventUrl: string,
  location: JsonLdObject,
): JsonLdObject[] {
  const validFrom = toIsoOrNull(event.createdAt)

  /*
   * paymentType 'door': schema.org kennt kein "Zahlung vor Ort". Der vorgesehene
   * Weg ist availableAtOrFrom — der Ort, an dem das Angebot erhältlich ist.
   * Nur mit Namen, damit der volle Place nicht je Tier wiederholt wird.
   */
  const atDoor =
    event.paymentType === 'door' && typeof location.name === 'string' && location.name
      ? { '@type': 'Place', name: location.name }
      : null

  const base = (): JsonLdObject => {
    const offer: JsonLdObject = {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      url: eventUrl,
    }
    if (validFrom) offer.validFrom = validFrom
    if (atDoor) offer.availableAtOrFrom = atDoor
    return offer
  }

  const soldOutUrl = 'https://schema.org/SoldOut'
  const inStockUrl = 'https://schema.org/InStock'

  const tiers = event.ticketTiers
  if (tiers && tiers.length > 0) {
    return tiers.map((tier) => {
      // quantity null heißt unbegrenzt — dann kann das Tier nicht ausverkauft sein.
      const tierSoldOut =
        event.soldOut === true ||
        (typeof tier.quantity === 'number' && (tier.soldCount ?? 0) >= tier.quantity)
      const offer = base()
      if (tier.name) offer.name = tier.name
      offer.price = tier.price ?? 0
      offer.availability = tierSoldOut ? soldOutUrl : inStockUrl
      return offer
    })
  }

  const offer = base()
  offer.price = event.price ?? 0
  offer.availability = event.soldOut === true ? soldOutUrl : inStockUrl
  return [offer]
}

/**
 * Das Event-Schema — oder null, wenn die Pflichtangaben fehlen.
 *
 * null kommt zurück, wenn Name oder Startdatum unbrauchbar sind. Ein Event ohne
 * startDate wäre ungültig, und ein geratenes Startdatum wäre schlimmer als gar
 * keine strukturierten Daten.
 */
export function buildEventJsonLd(
  event: EventForSchema,
  locale: Locale,
  fallbackId: string,
): JsonLdObject | null {
  if (!event?.name) return null

  const id = event._id || fallbackId
  const startDate = toIsoOrNull(event.eventStartTime) || toIsoOrNull(event.eventDate)
  if (!startDate) return null

  const eventUrl = canonicalUrl(`/event/${generateEventSlug(event.name, id)}`, locale)
  const location = buildLocation(event, eventUrl)

  const schema: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': eventUrl,
    url: eventUrl,
    name: event.name,
    startDate,
    /*
     * Ausverkauft ist KEIN eventStatus: schema.org kennt dafür keinen Wert,
     * das drückt allein Offer.availability aus. Ein ausverkauftes Event bleibt
     * EventScheduled.
     */
    eventStatus:
      String(event.status).toLowerCase() === 'cancelled'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled',
    eventAttendanceMode:
      event.locationType === 'online'
        ? 'https://schema.org/OnlineEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode',
    location,
  }

  // Nur ein Ende, das nach dem Start liegt. Fehlt es, bleibt das Feld weg —
  // keine Schätzung "Start plus drei Stunden".
  const endDate = toIsoOrNull(event.eventEndTime)
  if (endDate && endDate > startDate) schema.endDate = endDate

  const description = stripMarkdown(event.description)
  if (description) schema.description = description

  const image = event.locationImages?.[0]?.url || event.thumbnailUrl
  if (image) schema.image = [image]

  const organizer = organizerOf(event)
  if (organizer) {
    /*
     * Organization, nicht Person: Die Daten liefern nur einen Namen, eine
     * Unterscheidung ist nicht möglich — und Veranstalter verkaufen hier
     * gewerblich Tickets.
     */
    const organizerSchema: JsonLdObject = { '@type': 'Organization', name: organizer.name }
    if (organizer._id) organizerSchema.url = canonicalUrl(`/user/${organizer._id}`, locale)
    schema.organizer = organizerSchema
  }

  schema.offers = buildOffers(event, eventUrl, location)

  if (!event.ticketTiers?.length && (event.price ?? 0) === 0) {
    schema.isAccessibleForFree = true
  }

  /*
   * performer bleibt bewusst leer: Es gibt kein Feld dafür. Den Künstler aus
   * dem Titel zu schneiden ("LIVE: Wegz") wäre geraten, nicht belegt.
   *
   * maximumAttendeeCapacity ebenso: totalTickets steht bei Events mit Tiers
   * regelmäßig auf dem Default 1, während mehrere Tiers verkauft werden.
   */

  return schema
}

/**
 * Das öffentliche Event für die Seitenausgabe.
 *
 * URL und Optionen sind zeichengleich mit dem Aufruf in generateMetadata —
 * dadurch dedupliziert Next beide zu EINER Anfrage pro Renderdurchlauf.
 */
export async function fetchPublicEvent(id: string): Promise<EventForSchema | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://smylady-backend.onrender.com'
    const res = await fetch(`${apiUrl}/events/public/${id}?populateCreator=true`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data ?? null
  } catch {
    return null
  }
}
