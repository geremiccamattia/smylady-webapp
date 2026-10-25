import { addDays, viennaWallTimeToUtc } from '@/lib/eventSchedule'

/*
 * Beginn und Ende eines Events aus den Formularfeldern — gemeinsam für
 * CreateEvent und EditEvent.
 *
 * Vorher rechneten beide getrennt und mit setHours, also in der Zeitzone des
 * Geräts. EditEvent fehlte dabei der Folgetag-Schritt: Ein Event von 22:00 bis
 * 02:00 bekam das Ende am selben Tag, das Backend lehnte mit 400 ab („The event
 * end time must be after the start time"). Jetzt gilt eine Regel an einer
 * Stelle, und gerechnet wird in Wiener Zeit wie im Backend.
 */

/** Ohne Endzeit dauert ein Event so lange. Wert wie bisher in beiden Formularen. */
const DEFAULT_DURATION_MS = 4 * 60 * 60 * 1000

export interface EventTimeInput {
  /** Starttag "YYYY-MM-DD" (Formularfeld eventDate). */
  date: string
  /** "HH:mm" (Formularfeld eventStartTime). */
  startTime: string
  /** "HH:mm" am Starttag bzw. am Folgetag (Formularfeld „bis"); optional. */
  endTime?: string
  /** Mehrtägig: Endtag "YYYY-MM-DD"; leer bei eintägigen Events. */
  endDate?: string
  /** Mehrtägig: Endzeit am Endtag "HH:mm"; ohne Wert 23:59. */
  endDateTime?: string
}

export interface EventTimes {
  /** Wiener Mitternacht des Starttags — dieselbe Regel wie viennaStartOfDay im Backend. */
  eventDate: string
  eventStartTime: string
  eventEndTime: string
}

/**
 * Formularwerte → ISO-Zeitpunkte für das Backend. null, wenn Datum oder
 * Beginn fehlen bzw. unbrauchbar sind.
 *
 * Eintägig: Liegt das Ende nicht nach dem Beginn, liegt es am Folgetag.
 * Ein Ende, das tatsächlich VOR dem Beginn liegen soll, gibt es nicht — ein
 * „22:00 bis 02:00" ist immer eine Nacht über Mitternacht. Deshalb ohne
 * Rückfrage und ohne Sonderfall.
 *
 * Mehrtägig (endDate gesetzt): Das Ende steht ausdrücklich am Endtag und wird
 * nicht verschoben.
 */
export function buildEventTimes(input: EventTimeInput): EventTimes | null {
  const dayStart = viennaWallTimeToUtc(input.date, '00:00')
  const start = viennaWallTimeToUtc(input.date, input.startTime)
  if (!dayStart || !start) return null

  let end: Date | null
  if (input.endDate) {
    end = viennaWallTimeToUtc(input.endDate, input.endDateTime || '23:59')
  } else if (input.endTime) {
    end = viennaWallTimeToUtc(input.date, input.endTime)
    if (end && end.getTime() <= start.getTime()) {
      end = viennaWallTimeToUtc(addDays(input.date, 1), input.endTime)
    }
  } else {
    end = new Date(start.getTime() + DEFAULT_DURATION_MS)
  }
  if (!end) end = new Date(start.getTime() + DEFAULT_DURATION_MS)

  return {
    eventDate: dayStart.toISOString(),
    eventStartTime: start.toISOString(),
    eventEndTime: end.toISOString(),
  }
}
