'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import QRCode from 'react-qr-code'
import { Check, Copy, Loader2, Printer, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { isSafeBillingDownloadUrl } from '@/services/billing'
import {
  eventQrKey,
  PROMO_LIMITS,
  promoService,
  readPromoError,
  type EventQrState,
  type PromoCode,
} from '@/services/promo'

/**
 * QR-Code eines freigegebenen Events: Vorschau, Link kopieren und das
 * druckfertige PDF (A4) vom Backend. Der Tab wird noch im Klick geöffnet und
 * erst nach der Antwort auf das PDF gesetzt (Popup-Blocker, wie bei den
 * Belegen). Darunter der Rabattcode dieses Events — auch schon vor der
 * Freigabe, damit er beim ersten Aushang feststeht.
 */
export function EventQrDialog({
  eventId,
  eventName,
  open,
  onClose,
}: {
  eventId: string
  eventName: string
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [opening, setOpening] = useState(false)
  const [copied, setCopied] = useState(false)
  const query = useQuery<EventQrState>({
    queryKey: eventQrKey(eventId),
    queryFn: () => promoService.getEventQr(eventId),
    enabled: open,
    retry: false,
  })
  const qr = query.data

  const openPdf = async () => {
    if (opening) return
    const tab = typeof window !== 'undefined' ? window.open('', '_blank') : null
    if (tab) tab.opener = null
    setOpening(true)
    try {
      const link = await promoService.getPosterLink(eventId)
      if (!isSafeBillingDownloadUrl(link.url)) throw new Error('unsafe download url')
      if (!tab) window.location.assign(link.url)
      else if (!tab.closed) tab.location.href = link.url
    } catch (error) {
      tab?.close()
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description: readPromoError(
          error,
          t('promo.downloadFailed', {
            defaultValue: 'Das PDF lässt sich gerade nicht öffnen. Bitte versuche es noch einmal.',
          }),
        ),
      })
    } finally {
      setOpening(false)
    }
  }

  const copyLink = async () => {
    if (!qr?.url) return
    try {
      await navigator.clipboard.writeText(qr.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: qr.url })
    }
  }

  // Neu aufsetzen, sobald der gespeicherte Stand sich ändert (nach dem Speichern).
  const promoForm = qr && (
    <EventPromoForm key={`${qr.promoSource}:${qr.promoCode}:${qr.promoText}`} eventId={eventId} qr={qr} />
  )

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            {t('promo.qrTitle', { defaultValue: 'QR-Code zum Aufhängen' })}
          </DialogTitle>
          <DialogDescription>{eventName}</DialogDescription>
        </DialogHeader>

        {query.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : query.isError ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              {readPromoError(
                query.error,
                t('promo.qrLoadFailed', { defaultValue: 'Der QR-Code lässt sich gerade nicht laden.' }),
              )}
            </p>
            <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
              {t('promo.retry', { defaultValue: 'Erneut versuchen' })}
            </Button>
          </div>
        ) : !qr?.available || !qr.url ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('promo.notApproved', {
                defaultValue: 'Den QR-Code gibt es, sobald dein Event freigegeben ist.',
              })}
            </p>
            {promoForm}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {qr.hasPromoCode
                ? t('promo.qrDesc', {
                    defaultValue:
                      'Drucke den QR-Code aus und häng ihn auf deinem Event auf. Wer ihn scannt, sieht ohne Anmeldung deinen Rabattcode.',
                  })
                : t('promo.qrDescNoCode', {
                    defaultValue:
                      'Drucke den QR-Code aus und häng ihn auf deinem Event auf. Wer ihn scannt, landet ohne Anmeldung auf deiner Eventseite.',
                  })}
            </p>
            <div className="flex justify-center">
              <div className="rounded-xl bg-white p-4 shadow-sm border">
                <QRCode value={qr.url} size={200} />
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground break-all">{qr.url}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="gradient" className="flex-1 gap-2" onClick={openPdf} disabled={opening}>
                {opening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                {t('promo.download', { defaultValue: 'PDF zum Drucken öffnen' })}
              </Button>
              <Button variant="outline" className="gap-2" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied
                  ? t('promo.copied', { defaultValue: 'Link kopiert' })
                  : t('promo.copyLink', { defaultValue: 'Link kopieren' })}
              </Button>
            </div>
            {promoForm}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Rabattcode und Hinweis dieses Events (PUT /promo/events/:eventId). Steht
 * am Event keiner, zeigt das Formular den aus dem Profil; Speichern macht
 * ihn zum eigenen Code des Events, leer Speichern entfernt den eigenen.
 */
function EventPromoForm({ eventId, qr }: { eventId: string; qr: EventQrState }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<PromoCode>({ promoCode: qr.promoCode, promoText: qr.promoText })

  const save = useMutation({
    mutationFn: () => promoService.updateEventPromo(eventId, form),
    onSuccess: (saved) => {
      // Beschreibung und PDF lesen den neuen Stand sofort aus dem Cache bzw. beim nächsten Klick.
      queryClient.setQueryData(eventQrKey(eventId), saved)
      toast({
        title:
          saved.promoSource === 'event'
            ? t('promo.eventSaved', { defaultValue: 'Der Rabattcode für dieses Event wurde gespeichert.' })
            : saved.promoSource === 'profile'
              ? t('promo.eventResetToProfile', {
                  defaultValue: 'Eigener Rabattcode entfernt – es gilt wieder der aus deinem Profil.',
                })
              : t('promo.removed', { defaultValue: 'Dein Rabattcode wurde entfernt.' }),
      })
    },
    onError: (error) =>
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description: readPromoError(
          error,
          t('promo.saveFailed', { defaultValue: 'Der Rabattcode konnte nicht gespeichert werden.' }),
        ),
      }),
  })

  const unchanged = form.promoCode.trim() === qr.promoCode && form.promoText.trim() === qr.promoText
  const counter = (count: number, max: number) => (
    <span className="text-xs text-muted-foreground tabular-nums">
      {t('promo.charCount', { count, max, defaultValue: '{{count}}/{{max}}' })}
    </span>
  )

  return (
    <form
      className="space-y-3 border-t pt-4"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate()
      }}
    >
      <div>
        <h3 className="text-sm font-medium">
          {t('promo.eventCodeTitle', { defaultValue: 'Rabattcode für dieses Event' })}
        </h3>
        {qr.promoSource === 'profile' && (
          <p className="text-xs text-muted-foreground mt-1">
            {t('promo.fromProfile', { defaultValue: 'Aus deinem Profil übernommen – hier überschreiben' })}
          </p>
        )}
        {qr.promoSource === 'event' && (
          <p className="text-xs text-muted-foreground mt-1">
            {t('promo.ownCodeHint', {
              defaultValue: 'Eigener Code für dieses Event. Leer speichern, um wieder den Code aus deinem Profil zu verwenden.',
            })}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`eventPromoCode-${eventId}`}>{t('promo.codeLabel', { defaultValue: 'Rabattcode' })}</Label>
          {counter(form.promoCode.length, PROMO_LIMITS.promoCode)}
        </div>
        <Input
          id={`eventPromoCode-${eventId}`}
          value={form.promoCode}
          maxLength={PROMO_LIMITS.promoCode}
          autoComplete="off"
          placeholder={t('promo.codePlaceholder', { defaultValue: 'z. B. PARTY10' })}
          disabled={save.isPending}
          onChange={(e) => setForm({ ...form, promoCode: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`eventPromoText-${eventId}`}>{t('promo.textLabel', { defaultValue: 'Hinweis (optional)' })}</Label>
          {counter(form.promoText.length, PROMO_LIMITS.promoText)}
        </div>
        <Textarea
          id={`eventPromoText-${eventId}`}
          rows={2}
          value={form.promoText}
          maxLength={PROMO_LIMITS.promoText}
          placeholder={t('promo.textPlaceholder', { defaultValue: 'z. B. 10 % auf alle Getränke an der Bar' })}
          disabled={save.isPending || !form.promoCode.trim()}
          onChange={(e) => setForm({ ...form, promoText: e.target.value })}
        />
      </div>
      <Button type="submit" className="w-full sm:w-auto" disabled={save.isPending || unchanged}>
        {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {t('promo.saveEvent', { defaultValue: 'Speichern' })}
      </Button>
    </form>
  )
}
