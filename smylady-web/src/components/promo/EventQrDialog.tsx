'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import QRCode from 'react-qr-code'
import { Check, Copy, Loader2, Printer, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useLocalePath } from '@/hooks/useLocalePath'
import { isSafeBillingDownloadUrl } from '@/services/billing'
import { eventQrKey, promoService, readPromoError, type EventQrState } from '@/services/promo'

/**
 * QR-Code eines freigegebenen Events: Vorschau, Link kopieren und das
 * druckfertige PDF (A4) vom Backend. Der Tab wird noch im Klick geöffnet und
 * erst nach der Antwort auf das PDF gesetzt (Popup-Blocker, wie bei den
 * Belegen).
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
  const localePath = useLocalePath()
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

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
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
          <p className="text-sm text-muted-foreground">
            {t('promo.notApproved', {
              defaultValue: 'Den QR-Code gibt es, sobald dein Event freigegeben ist.',
            })}
          </p>
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
            {!qr.hasPromoCode && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                {t('promo.noCodeHint', { defaultValue: 'Du hast noch keinen Rabattcode hinterlegt.' })}{' '}
                <Link href={localePath('/profile')} className="font-medium underline" onClick={onClose}>
                  {t('promo.toProfile', { defaultValue: 'Rabattcode im Profil festlegen' })}
                </Link>
              </div>
            )}
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
