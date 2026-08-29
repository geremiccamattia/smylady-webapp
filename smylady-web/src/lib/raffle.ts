/**
 * Ist ein Gewinnspiel bereits ausgelost?
 *
 * Entspricht der Backend-Logik aus raffle-drawn.util.ts: ausgelost ist alles, was
 * einen Status ungleich 'active' trägt ODER bereits Gewinner eingetragen hat.
 *
 * Beide Bedingungen werden gebraucht, keine reicht allein:
 *  - Der Status kann 'drawing' oder 'completed' sein, während raffleWinners noch
 *    leer ist — beim laufenden Gewinnspiel der Weintage ist genau das der Fall
 *    (status 'completed', winners []).
 *  - Umgekehrt können Gewinner eingetragen sein, bevor der Status nachzieht.
 *
 * Ein leerer Status (undefined, null, '') gilt bewusst NICHT als ausgelost —
 * sonst würde ein Listen-Endpoint, der das Feld nicht mitliefert, schlagartig
 * jedes Gewinnspiel verstecken.
 *
 * Die Quelle ist absichtlich strukturell getypt statt an `Event` gebunden: derselbe
 * Test läuft über Event-Objekte aus den Listen-Endpoints UND über die Antwort von
 * GET /events/:id/raffle/status, die kein vollständiges Event ist.
 */
export interface RaffleDrawnSource {
  raffleStatus?: string | null
  raffleWinners?: unknown[] | null
}

export function isRaffleDrawn(source?: RaffleDrawnSource | null): boolean {
  if (!source) return false

  const status = source.raffleStatus
  if (status && status !== 'active') return true

  return Array.isArray(source.raffleWinners) && source.raffleWinners.length > 0
}

/** Umkehrung, für Filter besser lesbar als `!isRaffleDrawn(...)`. */
export function isRaffleOpen(source?: RaffleDrawnSource | null): boolean {
  return !isRaffleDrawn(source)
}
