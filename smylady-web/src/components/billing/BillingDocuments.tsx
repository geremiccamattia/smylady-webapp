'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Download, FileText, Receipt } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useLocalePath } from '@/hooks/useLocalePath'
import { formatDate, formatPrice } from '@/lib/utils'
import { readCreatorError } from '@/services/creator'
import {
  billingService,
  isSafeBillingDownloadUrl,
  type BillingDocumentSummary,
  type BillingDownloadLink,
} from '@/services/billing'
import { CREATOR_BILLING_ANCHOR } from './CreatorBillingCard'

/*
 * Belege zum Auftrag: Auszahlungsbelege beim Creator, Rechnung und Korrekturen
 * bei der Brand. Herunterladen geht über einen kurzlebigen Link
 * (POST …/download-link), der in einem neuen Tab aufgeht.
 */

/**
 * Lädt den Link und öffnet das PDF in einem neuen Tab.
 *
 * Der Tab wird noch im Klick geöffnet (leer) und erst nach der Antwort auf
 * das PDF gesetzt: Ein window.open nach einem await blocken Safari und
 * strenge Popup-Blocker. Ist gar kein Tab möglich, öffnet das PDF im selben
 * Fenster.
 */
function useDocumentDownload(getLink: (doc: BillingDocumentSummary) => Promise<BillingDownloadLink>) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [pendingId, setPendingId] = useState<string | null>(null)

  const download = async (doc: BillingDocumentSummary) => {
    if (pendingId) return
    const tab = typeof window !== 'undefined' ? window.open('', '_blank') : null
    if (tab) tab.opener = null
    setPendingId(doc.id)
    try {
      const link = await getLink(doc)
      if (!isSafeBillingDownloadUrl(link.url)) throw new Error('unsafe download url')
      if (!tab) window.location.assign(link.url)
      // Hat jemand den leeren Tab schon geschlossen, bleibt es dabei.
      else if (!tab.closed) tab.location.href = link.url
    } catch (error) {
      tab?.close()
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description: readCreatorError(error, t('billing.downloadFailed', { defaultValue: 'Das PDF lässt sich gerade nicht öffnen. Bitte versuche es noch einmal.' })),
      })
    } finally {
      setPendingId(null)
    }
  }

  return { download, pendingId }
}

function useDocumentKindLabel(): (doc: BillingDocumentSummary) => string {
  const { t } = useTranslation()
  return (doc) => {
    switch (doc.kind) {
      case 'brand_invoice_correction':
        return t('billing.kindCorrection', { defaultValue: 'Rechnungskorrektur' })
      case 'creator_credit_note':
        return t('billing.kindPayoutStatement', { defaultValue: 'Auszahlungsbeleg' })
      case 'brand_invoice':
      default:
        return t('billing.kindInvoice', { defaultValue: 'Rechnung' })
    }
  }
}

/** Eine Zeile: Art, Nummer, Datum, Betrag und der Download-Knopf. */
function DocumentRow({
  doc,
  loading,
  disabled,
  onDownload,
}: {
  doc: BillingDocumentSummary
  loading: boolean
  disabled: boolean
  onDownload: () => void
}) {
  const { t } = useTranslation()
  const kindLabel = useDocumentKindLabel()

  return (
    <li className="flex items-center justify-between gap-3 flex-wrap rounded-md border p-3">
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{kindLabel(doc)}</span>
          {doc.number && <span className="text-muted-foreground">{doc.number}</span>}
          {doc.kind === 'brand_invoice_correction' && (
            <Badge variant="outline" className="font-normal">
              {t('billing.correctionBadge', { defaultValue: 'Korrektur' })}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3">
          {doc.issuedAt && (
            <span>
              {t('billing.issuedAt', { date: formatDate(doc.issuedAt), defaultValue: 'vom {{date}}' })}
            </span>
          )}
          {doc.refersToNumber && (
            <span>
              {t('billing.refersTo', { number: doc.refersToNumber, defaultValue: 'zu Rechnung {{number}}' })}
            </span>
          )}
          {/* Auszahlungsbelege kennen keine Umsatzsteuer: dort nur der Betrag. */}
          {doc.kind === 'creator_credit_note' ? null : doc.vatRate > 0 ? (
            <span>
              {t('billing.vatIncluded', {
                rate: doc.vatRate,
                amount: formatPrice(doc.vatAmount, doc.currency),
                defaultValue: 'inkl. {{rate}} % USt ({{amount}})',
              })}
            </span>
          ) : (
            <span>{t('billing.noVat', { defaultValue: 'ohne USt' })}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-semibold tabular-nums ${doc.grossAmount < 0 ? 'text-destructive' : ''}`}>
          {formatPrice(doc.grossAmount, doc.currency)}
        </span>
        <Button type="button" variant="outline" size="sm" className="gap-2" loading={loading} disabled={disabled} onClick={onDownload}>
          <Download className="h-4 w-4" />
          {t('billing.downloadPdf', { defaultValue: 'PDF herunterladen' })}
        </Button>
      </div>
    </li>
  )
}

/** Neueste zuerst; ohne Datum (wartend) ans Ende. */
const byIssuedDesc = (a: BillingDocumentSummary, b: BillingDocumentSummary) =>
  (b.issuedAt ? new Date(b.issuedAt).getTime() : 0) - (a.issuedAt ? new Date(a.issuedAt).getTime() : 0)

/**
 * Creator-Auftragsdetail (/creator/assignments/:id): Abschnitt „Auszahlungsbeleg".
 *
 * Ohne Belege bleibt der Abschnitt weg — der Beleg kommt erst mit der
 * Auszahlung. Ebenso bei einem Ladefehler: Das ist hier Beiwerk, die Seite
 * soll nicht deshalb einen Fehler zeigen.
 */
export function CreatorPayoutStatementsSection({ assignmentId }: { assignmentId: string }) {
  const { t } = useTranslation()
  const localePath = useLocalePath()
  const query = useQuery<BillingDocumentSummary[]>({
    queryKey: ['creator', 'billing-documents', assignmentId],
    queryFn: () => billingService.listCreatorBillingDocuments(assignmentId),
    enabled: Boolean(assignmentId),
    retry: false,
  })
  const { download, pendingId } = useDocumentDownload((doc) => billingService.creatorDocumentDownloadLink(doc.id))

  // Auf den Auftrag filtert das Backend (?assignmentId=…).
  const docs = (query.data ?? []).filter((doc) => doc.kind === 'creator_credit_note').sort(byIssuedDesc)
  if (docs.length === 0) return null

  const issued = docs.filter((doc) => doc.status === 'issued')
  const waiting = docs.some((doc) => doc.status === 'pending_billing_data')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          {t('billing.payoutStatementSection', { defaultValue: 'Auszahlungsbeleg' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {waiting && (
          <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50/60 p-3 text-yellow-900">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              {t('billing.payoutStatementPending', { defaultValue: 'Dein Auszahlungsbeleg wartet auf deinen Namen und deine Anschrift.' })}{' '}
              <Link href={localePath(`/creator/profile#${CREATOR_BILLING_ANCHOR}`)} className="underline hover:no-underline">
                {t('billing.payoutStatementPendingLink', { defaultValue: 'Abrechnungsdaten eintragen' })}
              </Link>
            </p>
          </div>
        )}
        {issued.length > 0 && (
          <ul className="space-y-2">
            {issued.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                loading={pendingId === doc.id}
                disabled={pendingId !== null}
                onDownload={() => download(doc)}
              />
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          {t('billing.payoutStatementHint', {
            defaultValue: 'Den Auszahlungsbeleg bekommst du auch per E-Mail. Für deine Steuern bist du selbst verantwortlich.',
          })}
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * Brand-Auftragsdetail (/brand/orders/:id): Abschnitt „Rechnung" mit
 * Rechnung und Korrekturen.
 *
 * `fallback` sind die alten Stripe-Rechnungslinks: Sie stehen nur da, wenn
 * es (noch) keine eigene Rechnung gibt — bei Altaufträgen oder solange das
 * Backend die Belege nicht liefert. Ohne beides bleibt der Abschnitt weg.
 */
export function BrandInvoiceSection({
  orderId,
  enabled,
  refreshKey = '',
  fallback,
}: {
  orderId: string
  /** Erst ab dem Zahlungseingang gibt es eine Rechnung. */
  enabled: boolean
  /** Ändert sich mit dem Zahlungsstand (z. B. Erstattung), damit die Korrektur nachgeladen wird. */
  refreshKey?: string
  fallback?: ReactNode
}) {
  const { t } = useTranslation()
  const query = useQuery<BillingDocumentSummary[]>({
    queryKey: ['brand', 'order-billing-documents', orderId, refreshKey],
    queryFn: () => billingService.listBrandOrderBillingDocuments(orderId),
    enabled: enabled && Boolean(orderId),
    retry: false,
  })
  const { download, pendingId } = useDocumentDownload((doc) => billingService.brandDocumentDownloadLink(orderId, doc.id))

  if (!enabled) return null

  const docs = (query.data ?? [])
    .filter((doc) => doc.status === 'issued' && (doc.kind === 'brand_invoice' || doc.kind === 'brand_invoice_correction'))
    .sort(byIssuedDesc)
  const showFallback = docs.length === 0 && !query.isLoading && Boolean(fallback)
  if (docs.length === 0 && !showFallback) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t('billing.invoiceSection', { defaultValue: 'Rechnung' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {docs.length > 0 ? (
          <>
            <ul className="space-y-2">
              {docs.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  loading={pendingId === doc.id}
                  disabled={pendingId !== null}
                  onDownload={() => download(doc)}
                />
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              {t('billing.invoiceHint', { defaultValue: 'Die Rechnung und etwaige Korrekturen bekommst du auch per E-Mail.' })}
            </p>
          </>
        ) : (
          fallback
        )}
      </CardContent>
    </Card>
  )
}
