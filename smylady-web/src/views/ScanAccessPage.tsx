'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { CameraOff, CheckCircle, Loader2, WifiOff, XCircle } from 'lucide-react'

import { publicClient } from '@/services/api'

/**
 * Scan-Seite für Einlasspersonal ohne Konto.
 *
 * Zugang ausschliesslich über den Token in der URL — kein Login, keine App. Die
 * Seite liegt bewusst ausserhalb von (app): kein Header, keine Navigation, keine
 * Links in die restliche Anwendung. Wer den Link hat, soll scannen können und
 * sonst nichts sehen — insbesondere keine Gästeliste und keine Teilnehmerzahlen.
 *
 * Bedienung: Handy, Hochformat, einhändig, im Dunkeln, in Eile. Deshalb
 * ganzflächige Ergebnisse in Grün/Rot statt kleiner Hinweise, und nach jedem Scan
 * geht es von selbst weiter — niemand muss etwas antippen.
 */

interface ScanSession {
  eventId: string
  eventName: string
  eventDate?: string
  expiresAt: string
}

type Outcome =
  | { kind: 'ok'; name: string }
  | { kind: 'already'; name: string; scannedAt?: string }
  | { kind: 'invalid'; message: string }
  /** Netzfehler — das Ticket wurde NICHT geprüft. Muss klar davon unterscheidbar
   *  sein, dass ein Ticket ungültig ist: Niemand darf abgewiesen werden, weil das
   *  WLAN wackelt. */
  | { kind: 'network' }
  /** Der Zugangslink ist während des Scannens abgelaufen oder widerrufen worden. */
  | { kind: 'linkExpired' }

/** So lange bleibt das Ergebnis stehen, bevor die Kamera von selbst weiterläuft. */
const RESULT_MS = 2500

export default function ScanAccessPage({ token }: { token: string }) {
  const [session, setSession] = useState<ScanSession | null>(null)
  const [sessionState, setSessionState] = useState<'loading' | 'invalid' | 'ready'>('loading')
  const [cameraDenied, setCameraDenied] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [checking, setChecking] = useState(false)
  const [count, setCount] = useState(0)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Verhindert, dass ein zweiter Scan hereinläuft, während noch geprüft wird.
  const busy = useRef(false)

  // ── Zugang prüfen ─────────────────────────────────────────────────────────
  // Läuft bei jedem Laden neu. Der Token steht in der URL, ein versehentliches
  // Neuladen setzt die Seite deshalb nicht zurück — sie ist sofort wieder bereit.
  useEffect(() => {
    let cancelled = false
    publicClient
      .get(`/tickets/scan-session/${encodeURIComponent(token)}`)
      .then((res) => {
        if (cancelled) return
        setSession(res.data?.data ?? res.data)
        setSessionState('ready')
      })
      .catch(() => {
        if (cancelled) return
        // Bewusst kein Weiterleiten und keine Anmeldeaufforderung: Wer hier landet,
        // hat kein Konto und könnte sich gar nicht anmelden.
        setSessionState('invalid')
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const showOutcome = useCallback((next: Outcome) => {
    setOutcome(next)
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => {
      setOutcome(null)
      busy.current = false
      try {
        scannerRef.current?.resume()
      } catch {
        // Scanner bereits gestoppt (Seite verlassen) — nichts zu tun.
      }
    }, RESULT_MS)
  }, [])

  const verify = useCallback(
    async (ticketId: string, verificationCode: string, eventId: string) => {
      setChecking(true)
      try {
        const res = await publicClient.post('/tickets/verify-qr/token', {
          token,
          ticketId,
          verificationCode,
          eventId,
        })
        const data = res.data?.data ?? res.data
        const name = data?.userName || 'Gast'
        if (data?.alreadyScanned) {
          showOutcome({ kind: 'already', name, scannedAt: data?.scannedAt })
        } else {
          setCount((c) => c + 1)
          showOutcome({ kind: 'ok', name })
        }
      } catch (err: any) {
        if (!err?.response) {
          // Keine Antwort erhalten -> Netzproblem, nicht das Ticket.
          showOutcome({ kind: 'network' })
        } else if (err.response.status === 401 || err.response.status === 403) {
          showOutcome({ kind: 'linkExpired' })
        } else {
          showOutcome({
            kind: 'invalid',
            message: err.response?.data?.message || 'Ungültiges Ticket',
          })
        }
      } finally {
        setChecking(false)
      }
    },
    [token, showOutcome],
  )

  const onScan = useCallback(
    (decoded: string) => {
      if (busy.current) return
      busy.current = true
      try {
        scannerRef.current?.pause()
      } catch {
        // Ignorieren — der Scanner läuft ggf. schon nicht mehr.
      }

      try {
        const qr = JSON.parse(decoded)
        const { ticketId, verificationCode, eventId } = qr
        if (!ticketId || !verificationCode || !eventId) {
          showOutcome({ kind: 'invalid', message: 'QR-Code nicht lesbar' })
          return
        }
        void verify(ticketId, verificationCode, eventId)
      } catch {
        showOutcome({ kind: 'invalid', message: 'QR-Code nicht lesbar' })
      }
    },
    [verify, showOutcome],
  )

  // ── Kamera starten, sobald der Zugang gültig ist ──────────────────────────
  useEffect(() => {
    if (sessionState !== 'ready') return

    let stopped = false
    const scanner = new Html5Qrcode('scan-reader')
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScan,
        undefined,
      )
      .catch(() => {
        if (!stopped) setCameraDenied(true)
      })

    return () => {
      stopped = true
      if (resetTimer.current) clearTimeout(resetTimer.current)
      scanner.stop().catch(() => {})
      scannerRef.current = null
    }
  }, [sessionState, onScan])

  // ── Zugang ungültig ───────────────────────────────────────────────────────
  if (sessionState === 'invalid') {
    return (
      <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-8 text-center">
        <XCircle className="h-24 w-24 text-red-500 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-3">Zugang ungültig</h1>
        <p className="text-lg text-neutral-300 max-w-sm">
          Dieser Zugang ist ungültig oder abgelaufen.
        </p>
      </div>
    )
  }

  if (sessionState === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    )
  }

  const expires = new Date(session!.expiresAt)
  const eventDate = session!.eventDate ? new Date(session!.eventDate) : null

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col">
      {/* Kopfzeile — Eventname, Datum, Ablauf des Zugangs */}
      <header className="px-4 pt-5 pb-4 border-b border-neutral-700">
        <h1 className="text-xl font-bold text-white leading-tight">{session!.eventName}</h1>
        <p className="text-base text-neutral-300 mt-1">
          {eventDate
            ? eventDate.toLocaleDateString('de-AT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
            : null}
        </p>
        <p className="text-sm text-neutral-400 mt-1">
          Zugang gültig bis{' '}
          {expires.toLocaleString('de-AT', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}{' '}
          Uhr
        </p>
      </header>

      {/* Kamera */}
      <div className="relative flex-1 min-h-[60vh]">
        <div id="scan-reader" className="w-full h-full" />

        {cameraDenied && (
          <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center p-8 text-center">
            <CameraOff className="h-20 w-20 text-neutral-400 mb-6" />
            <h2 className="text-xl font-bold text-white mb-3">Kein Kamerazugriff</h2>
            <p className="text-base text-neutral-300 max-w-sm">
              Erlaube den Kamerazugriff in den Einstellungen deines Browsers und lade die
              Seite neu.
            </p>
          </div>
        )}

        {checking && !outcome && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <Loader2 className="h-14 w-14 animate-spin text-white" />
          </div>
        )}

        {/* Ergebnis — ganzflächig, damit es aus zwei Metern erkennbar ist */}
        {outcome && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center ${
              outcome.kind === 'ok'
                ? 'bg-green-600'
                : outcome.kind === 'network'
                  ? 'bg-amber-500'
                  : 'bg-red-600'
            }`}
          >
            {outcome.kind === 'ok' && (
              <>
                <CheckCircle className="h-28 w-28 text-white mb-4" />
                <p className="text-4xl font-black text-white leading-none">GÜLTIG</p>
                <p className="text-2xl text-white mt-4 font-semibold break-words">
                  {outcome.name}
                </p>
              </>
            )}

            {outcome.kind === 'already' && (
              <>
                <XCircle className="h-28 w-28 text-white mb-4" />
                <p className="text-4xl font-black text-white leading-none">
                  BEREITS
                  <br />
                  ENTWERTET
                </p>
                <p className="text-2xl text-white mt-4 font-semibold break-words">
                  {outcome.name}
                </p>
                {outcome.scannedAt && (
                  <p className="text-lg text-white/90 mt-2">
                    um{' '}
                    {new Date(outcome.scannedAt).toLocaleTimeString('de-AT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    Uhr
                  </p>
                )}
              </>
            )}

            {outcome.kind === 'invalid' && (
              <>
                <XCircle className="h-28 w-28 text-white mb-4" />
                <p className="text-4xl font-black text-white leading-none">UNGÜLTIG</p>
                <p className="text-xl text-white/90 mt-4">{outcome.message}</p>
              </>
            )}

            {outcome.kind === 'network' && (
              <>
                <WifiOff className="h-28 w-28 text-white mb-4" />
                <p className="text-4xl font-black text-white leading-none">KEIN NETZ</p>
                <p className="text-xl text-white mt-4 font-semibold">
                  Ticket wurde nicht geprüft — bitte erneut scannen.
                </p>
              </>
            )}

            {outcome.kind === 'linkExpired' && (
              <>
                <XCircle className="h-28 w-28 text-white mb-4" />
                <p className="text-4xl font-black text-white leading-none">
                  ZUGANG
                  <br />
                  ABGELAUFEN
                </p>
                <p className="text-xl text-white/90 mt-4">
                  Bitte einen neuen Zugangslink anfordern.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Zähler dieser Sitzung */}
      <footer className="px-4 py-5 border-t border-neutral-700 flex items-baseline justify-center gap-3">
        <span className="text-5xl font-black text-white tabular-nums">{count}</span>
        <span className="text-lg text-neutral-300">
          {count === 1 ? 'Ticket gescannt' : 'Tickets gescannt'}
        </span>
      </footer>
    </div>
  )
}
