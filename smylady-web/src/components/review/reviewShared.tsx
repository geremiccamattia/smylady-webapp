'use client'

import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle2, Clock, FileText, Gavel, Image as ImageIcon, MessageSquare, Paperclip, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime, formatPrice } from '@/lib/utils'
import {
  REVIEW_EVIDENCE_MAX_BYTES,
  REVIEW_EVIDENCE_MAX_FILES,
  type PerformanceReview,
  type ReviewEvidence,
  type ReviewOutcome,
  type ReviewReason,
  type ReviewStatus,
} from '@/services/review'

/**
 * Gemeinsame Bausteine der Leistungsprüfung für Brand- und Creator-Seite:
 * Beschriftungen, Status-Badge, Belege (anzeigen und auswählen) und die
 * Zusammenfassung von Meldung, Stellungnahme und Entscheidung.
 */

export function useReviewLabels() {
  const { t } = useTranslation()

  const reason = (value: ReviewReason): string =>
    ({
      no_show: t('review.reasonNoShow', { defaultValue: 'Nicht erschienen' }),
      late: t('review.reasonLate', { defaultValue: 'Zu spät gekommen' }),
      content_missing: t('review.reasonContentMissing', { defaultValue: 'Content nicht geliefert' }),
      conduct: t('review.reasonConduct', { defaultValue: 'Verhalten / Regelverstoß' }),
      other: t('review.reasonOther', { defaultValue: 'Sonstiges' }),
    })[value] ?? value

  const outcome = (value: ReviewOutcome): string =>
    ({
      full: t('review.outcomeFull', { defaultValue: 'Volle Auszahlung' }),
      partial: t('review.outcomePartial', { defaultValue: 'Gekürzte Auszahlung' }),
      withheld: t('review.outcomeWithheld', { defaultValue: 'Vergütung einbehalten' }),
    })[value] ?? value

  const status = (value: ReviewStatus): string =>
    ({
      pending: t('review.statusPending', { defaultValue: 'Bestätigung offen' }),
      confirmed: t('review.statusConfirmed', { defaultValue: 'Leistung bestätigt' }),
      reported: t('review.statusReported', { defaultValue: 'Problem gemeldet' }),
      responded: t('review.statusResponded', { defaultValue: 'Stellungnahme liegt vor' }),
      decided: t('review.statusDecided', { defaultValue: 'Entschieden' }),
    })[value] ?? value

  return { reason, outcome, status }
}

export function ReviewStatusBadge({ review }: { review: PerformanceReview }) {
  const { status } = useReviewLabels()
  const label = status(review.status)
  switch (review.status) {
    case 'confirmed':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {label}
        </Badge>
      )
    case 'reported':
      return (
        <Badge variant="destructive">
          <AlertTriangle className="mr-1 h-3 w-3" />
          {label}
        </Badge>
      )
    case 'responded':
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <MessageSquare className="mr-1 h-3 w-3" />
          {label}
        </Badge>
      )
    case 'decided':
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
          <Gavel className="mr-1 h-3 w-3" />
          {label}
        </Badge>
      )
    default:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <Clock className="mr-1 h-3 w-3" />
          {label}
        </Badge>
      )
  }
}

/** Hochgeladene Belege als Links; Bilder mit Vorschau, PDF mit Symbol. */
export function EvidenceLinks({ evidence }: { evidence: ReviewEvidence[] }) {
  const { t } = useTranslation()
  if (evidence.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {evidence.map((item, index) => {
        const isPdf = item.mimeType === 'application/pdf' || /\.pdf$/i.test(item.fileName || item.url)
        const label = item.fileName || t('review.evidenceN', { n: index + 1, defaultValue: 'Beleg {{n}}' })
        return (
          <a
            key={`${item.url}-${index}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs hover:bg-muted max-w-full"
            title={label}
          >
            {isPdf ? (
              <FileText className="h-3.5 w-3.5 shrink-0" />
            ) : item.thumbnailUrl || item.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.thumbnailUrl || item.url} alt="" className="h-6 w-6 rounded object-cover shrink-0" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate">{label}</span>
          </a>
        )
      })}
    </div>
  )
}

/**
 * Dateiauswahl für Belege: Bilder oder PDF, je bis 10 MB, höchstens fünf.
 * Prüft vor dem Upload, damit die Meldung nicht an einem 400 scheitert.
 */
export function EvidencePicker({
  files,
  onChange,
  disabled,
}: {
  files: File[]
  onChange: (files: File[], error: string | null) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  const add = (incoming: FileList | null) => {
    if (!incoming) return
    const next = [...files]
    let error: string | null = null
    for (const file of Array.from(incoming)) {
      const ok = file.type === 'application/pdf' || file.type.startsWith('image/')
      if (!ok) {
        error = t('review.evidenceTypeError', { defaultValue: 'Nur Bilder (JPG, PNG, WebP, HEIC) oder PDF.' })
        continue
      }
      if (file.size > REVIEW_EVIDENCE_MAX_BYTES) {
        error = t('review.evidenceSizeError', { defaultValue: 'Ein Beleg darf höchstens 10 MB groß sein.' })
        continue
      }
      if (next.length >= REVIEW_EVIDENCE_MAX_FILES) {
        error = t('review.evidenceCountError', { count: REVIEW_EVIDENCE_MAX_FILES, defaultValue: 'Höchstens {{count}} Belege.' })
        break
      }
      next.push(file)
    }
    onChange(next, error)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(event) => add(event.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={disabled || files.length >= REVIEW_EVIDENCE_MAX_FILES}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="h-4 w-4" />
        {t('review.addEvidence', { defaultValue: 'Beleg hinzufügen' })}
      </Button>
      <p className="text-xs text-muted-foreground">
        {t('review.evidenceHint', {
          count: REVIEW_EVIDENCE_MAX_FILES,
          defaultValue: 'Bilder oder PDF, je bis 10 MB, höchstens {{count}} Dateien. Freiwillig, aber hilfreich.',
        })}
      </p>
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center gap-2 text-xs">
              {file.type === 'application/pdf' ? <FileText className="h-3.5 w-3.5 shrink-0" /> : <ImageIcon className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate flex-1">{file.name}</span>
              <span className="text-muted-foreground">{Math.round(file.size / 1024)} KB</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                disabled={disabled}
                onClick={() => onChange(files.filter((_, candidate) => candidate !== index), null)}
                aria-label={t('common.remove', { defaultValue: 'Entfernen' })}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Die Meldung der Brand: Grund, Text, Belege, Zeitpunkt. */
export function ReviewReportSummary({ review }: { review: PerformanceReview }) {
  const { t } = useTranslation()
  const labels = useReviewLabels()
  if (!review.report) return null
  return (
    <div className="rounded-md border border-red-200 bg-red-50/50 p-3 text-sm space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <AlertTriangle className="h-4 w-4 text-red-700 shrink-0" />
        <span className="font-medium">{labels.reason(review.report.reason)}</span>
        {review.report.at && <span className="text-xs text-muted-foreground">{formatDateTime(review.report.at)}</span>}
      </div>
      <p className="whitespace-pre-wrap">{review.report.text}</p>
      <EvidenceLinks evidence={review.report.evidence} />
      {!review.response && review.status === 'reported' && review.responseDeadlineAt && (
        <p className="text-xs text-muted-foreground">
          {t('review.responseDeadlineHint', {
            date: formatDateTime(review.responseDeadlineAt),
            defaultValue: 'Stellungnahme des Creators möglich bis {{date}}.',
          })}
        </p>
      )}
    </div>
  )
}

/** Die Stellungnahme des Creators. */
export function ReviewResponseSummary({ review }: { review: PerformanceReview }) {
  const { t } = useTranslation()
  if (!review.response) return null
  return (
    <div className="rounded-md border border-blue-200 bg-blue-50/50 p-3 text-sm space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <MessageSquare className="h-4 w-4 text-blue-700 shrink-0" />
        <span className="font-medium">{t('review.responseTitle', { defaultValue: 'Stellungnahme des Creators' })}</span>
        {review.response.at && <span className="text-xs text-muted-foreground">{formatDateTime(review.response.at)}</span>}
      </div>
      <p className="whitespace-pre-wrap">{review.response.text}</p>
      <EvidenceLinks evidence={review.response.evidence} />
    </div>
  )
}

/**
 * Unsere Entscheidung mit Begründung. Die Brand sieht, was an sie
 * zurückgeht; der Creator, was an ihn geht (amount kommt nur in seiner Sicht).
 */
export function ReviewDecisionSummary({ review, audience }: { review: PerformanceReview; audience: 'brand' | 'creator' }) {
  const { t } = useTranslation()
  const labels = useReviewLabels()
  const decision = review.decision
  if (!decision) return null

  const summary =
    audience === 'creator'
      ? decision.outcome === 'full'
        ? t('review.decisionCreatorFull', {
            amount: decision.amount !== null ? formatPrice(decision.amount) : '',
            defaultValue: 'Deine Vergütung wird in voller Höhe ({{amount}}) ausgezahlt.',
          })
        : decision.outcome === 'withheld'
          ? t('review.decisionCreatorWithheld', { defaultValue: 'Deine Vergütung wird einbehalten und nicht ausgezahlt.' })
          : t('review.decisionCreatorPartial', {
              percent: decision.payoutPercent,
              amount: decision.amount !== null ? formatPrice(decision.amount) : '',
              defaultValue: 'Deine Vergütung wird auf {{percent}} % gekürzt; ausgezahlt werden {{amount}}.',
            })
      : decision.outcome === 'full'
        ? t('review.decisionBrandFull', { defaultValue: 'Die Vergütung des Creators wird in voller Höhe ausgezahlt.' })
        : decision.outcome === 'withheld'
          ? t('review.decisionBrandWithheld', {
              amount: formatPrice(decision.refundAmount),
              defaultValue: 'Die Vergütung des Creators wird einbehalten. {{amount}} gehen an dich zurück.',
            })
          : t('review.decisionBrandPartial', {
              percent: 100 - decision.payoutPercent,
              amount: formatPrice(decision.refundAmount),
              defaultValue: 'Die Vergütung des Creators wird um {{percent}} % gekürzt. {{amount}} gehen an dich zurück.',
            })

  return (
    <div className="rounded-md border border-purple-200 bg-purple-50/50 p-3 text-sm space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Gavel className="h-4 w-4 text-purple-700 shrink-0" />
        <span className="font-medium">{labels.outcome(decision.outcome)}</span>
        {decision.at && <span className="text-xs text-muted-foreground">{formatDateTime(decision.at)}</span>}
      </div>
      <p>{summary}</p>
      <p className="whitespace-pre-wrap">
        <span className="text-muted-foreground">{t('review.decisionReason', { defaultValue: 'Begründung' })}:</span> {decision.reason}
      </p>
      {audience === 'brand' && decision.refundAmount > 0 && (
        <p className="text-xs text-muted-foreground">
          {decision.refundManual
            ? t('review.refundManualHint', { defaultValue: 'Die Erstattung überweisen wir dir; wir melden uns dazu.' })
            : t('review.refundStripeHint', {
                defaultValue: 'Die Erstattung läuft über Stripe auf dein ursprüngliches Zahlungsmittel; je nach Bank dauert das einige Tage.',
              })}
        </p>
      )}
    </div>
  )
}
