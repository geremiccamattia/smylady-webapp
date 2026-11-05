'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Check, Copy, Loader2, MapPin, TicketPercent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { resolveImageUrl } from '@/lib/utils'
import { promoService, type PublicPromoPage } from '@/services/promo'

/**
 * Die Seite hinter dem QR-Code, der auf dem Event hängt.
 *
 * Ohne Login und ohne Navigation (liegt wie /s/[token] außerhalb von (app)):
 * Gast scannt, sieht den Rabattcode des Veranstalters und kann ihn kopieren.
 * Ohne Rabattcode zeigt die Seite das Event mit dem Weg zur Eventseite.
 */

/** Datum/Uhrzeit in Wiener Zeit, unabhängig vom Gerät des Gasts. */
function formatStart(value: string | null, locale: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Europe/Vienna',
  })
}

export default function PromoQrPage({ token }: { token: string }) {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState<PublicPromoPage | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'notFound' | 'error'>('loading')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    promoService
      .getPublicPage(token)
      .then((data) => {
        if (cancelled) return
        setPage(data)
        setState('ready')
      })
      .catch((error: { response?: { status?: number } }) => {
        if (cancelled) return
        setState(error?.response?.status === 404 ? 'notFound' : 'error')
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const copyCode = async () => {
    if (!page?.promo) return
    try {
      await navigator.clipboard.writeText(page.promo.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ohne Zugriff auf die Zwischenablage bleibt der Code zum Abschreiben stehen.
    }
  }

  if (state === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (state !== 'ready' || !page) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-sm text-center space-y-4">
          <p className="text-lg font-semibold">
            {state === 'notFound'
              ? t('promo.notFound', { defaultValue: 'Diesen QR-Code gibt es nicht (mehr).' })
              : t('promo.pageLoadFailed', {
                  defaultValue: 'Die Seite lässt sich gerade nicht laden. Bitte versuche es gleich noch einmal.',
                })}
          </p>
          <Button variant="gradient" asChild>
            <Link href="/">{t('promo.discover', { defaultValue: 'Events entdecken' })}</Link>
          </Button>
        </div>
      </main>
    )
  }

  const { event, organizer, promo } = page
  const start = formatStart(event.eventStartTime, i18n.language?.startsWith('en') ? 'en-GB' : 'de-AT')
  const image = resolveImageUrl(event.imageUrl)
  const cancelled = event.status === 'Cancelled'

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/10 to-background">
      <div className="mx-auto max-w-md px-5 py-8 space-y-6">
        <p className="text-center text-xs font-bold tracking-[0.2em] text-muted-foreground">SHARE YOUR PARTY</p>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-44 w-full object-cover" />
          )}
          <div className="space-y-2 p-5">
            <h1 className="text-2xl font-bold leading-tight">{event.name}</h1>
            {organizer.name && (
              <p className="text-sm text-muted-foreground">
                {t('promo.byOrganizer', { name: organizer.name, defaultValue: 'von {{name}}' })}
              </p>
            )}
            {start && (
              <p className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-primary" />
                {start}
              </p>
            )}
            {event.locationName && (
              <p className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                {event.locationName}
              </p>
            )}
          </div>
        </div>

        {cancelled && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-center text-sm">
            {t('promo.cancelled', { defaultValue: 'Dieses Event wurde abgesagt.' })}
          </p>
        )}

        {promo && (
          <div className="rounded-2xl border-2 border-dashed border-primary bg-card p-6 text-center space-y-3">
            <p className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
              <TicketPercent className="h-4 w-4 text-primary" />
              {t('promo.yourCode', { defaultValue: 'Dein Rabattcode' })}
            </p>
            <p className="break-all font-mono text-3xl font-bold tracking-wider">{promo.code}</p>
            {promo.text && <p className="text-sm">{promo.text}</p>}
            <Button variant="outline" size="sm" className="gap-2" onClick={copyCode}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied
                ? t('promo.codeCopied', { defaultValue: 'Code kopiert' })
                : t('promo.copyCode', { defaultValue: 'Code kopieren' })}
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button variant="gradient" size="lg" asChild>
            <Link href={event.path}>{t('promo.toEvent', { defaultValue: 'Zum Event' })}</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/">{t('promo.discover', { defaultValue: 'Events entdecken' })}</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
