/**
 * Leistungsprüfung nach dem Event — die Sicht, die Brand und Creator vom
 * Backend bekommen (AssignmentReviewView im CreatorAssignmentService).
 *
 * Ablauf: Nach dem Eventende hat die Brand 7 Tage, je Creator die Leistung
 * zu bestätigen oder ein Problem zu melden ('pending' → 'confirmed' |
 * 'reported'). Auf eine Meldung hat der Creator 5 Tage für eine
 * Stellungnahme ('responded'); dann entscheidet Share Your Party
 * ('decided': voll, gekürzt, einbehalten). Ohne Rückmeldung gilt die
 * Leistung nach der Frist als bestätigt (autoConfirmed).
 */

export type ReviewStatus = 'pending' | 'confirmed' | 'reported' | 'responded' | 'decided'
const REVIEW_STATUSES: readonly string[] = ['pending', 'confirmed', 'reported', 'responded', 'decided']

export const REVIEW_REASONS = ['no_show', 'late', 'content_missing', 'conduct', 'other'] as const
export type ReviewReason = (typeof REVIEW_REASONS)[number]

export type ReviewOutcome = 'full' | 'partial' | 'withheld'
const REVIEW_OUTCOMES: readonly string[] = ['full', 'partial', 'withheld']

/** Obergrenzen wie im Backend (REVIEW_EVIDENCE_* in brand-order.service.ts). */
export const REVIEW_EVIDENCE_MAX_FILES = 5
export const REVIEW_EVIDENCE_MAX_BYTES = 10 * 1024 * 1024
export const REVIEW_TEXT_MAX_LENGTH = 2000

export interface ReviewEvidence {
  url: string
  thumbnailUrl: string
  fileName: string
  mimeType: string
}

export interface PerformanceReview {
  status: ReviewStatus
  /** Alt-Eintrag ohne Prüfung — gilt als bestätigt. */
  legacy: boolean
  /** Bis wann die Brand bestätigen oder melden kann; leer vor dem Eventende. */
  deadlineAt: string
  confirmedAt: string
  autoConfirmed: boolean
  report: { reason: ReviewReason; text: string; evidence: ReviewEvidence[]; at: string } | null
  /** Bis wann der Creator Stellung nehmen kann. */
  responseDeadlineAt: string
  response: { text: string; evidence: ReviewEvidence[]; at: string } | null
  decision: {
    outcome: ReviewOutcome
    reason: string
    at: string
    payoutPercent: number
    /** Nur in der Creator-Sicht: was an ihn geht. */
    amount: number | null
    /** Was an die Brand zurückgeht. */
    refundAmount: number
    /** Die Erstattung läuft von Hand (Zahlung ausserhalb von Stripe). */
    refundManual: boolean
  } | null
}

const text = (value: unknown): string => (typeof value === 'string' ? value : value == null ? '' : String(value))
const safeLink = (value: unknown): string => {
  const trimmed = text(value).trim()
  return /^https?:\/\//i.test(trimmed) ? trimmed : ''
}

function mapEvidence(raw: unknown): ReviewEvidence[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => ({
      url: safeLink(item?.url),
      thumbnailUrl: safeLink(item?.thumbnailUrl),
      fileName: text(item?.fileName),
      mimeType: text(item?.mimeType),
    }))
    .filter((item) => item.url)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPerformanceReview(raw: any): PerformanceReview | null {
  if (!raw || typeof raw !== 'object' || !REVIEW_STATUSES.includes(raw.status)) return null
  const amount = Number(raw.decision?.amount)
  return {
    status: raw.status as ReviewStatus,
    legacy: Boolean(raw.legacy),
    deadlineAt: text(raw.deadlineAt),
    confirmedAt: text(raw.confirmedAt),
    autoConfirmed: Boolean(raw.autoConfirmed),
    report:
      raw.report && typeof raw.report === 'object'
        ? {
            reason: (REVIEW_REASONS as readonly string[]).includes(raw.report.reason) ? (raw.report.reason as ReviewReason) : 'other',
            text: text(raw.report.text),
            evidence: mapEvidence(raw.report.evidence),
            at: text(raw.report.at),
          }
        : null,
    responseDeadlineAt: text(raw.responseDeadlineAt),
    response:
      raw.response && typeof raw.response === 'object'
        ? { text: text(raw.response.text), evidence: mapEvidence(raw.response.evidence), at: text(raw.response.at) }
        : null,
    decision:
      raw.decision && typeof raw.decision === 'object' && REVIEW_OUTCOMES.includes(raw.decision.outcome)
        ? {
            outcome: raw.decision.outcome as ReviewOutcome,
            reason: text(raw.decision.reason),
            at: text(raw.decision.at),
            payoutPercent: Number(raw.decision.payoutPercent) || 0,
            amount: Number.isFinite(amount) && raw.decision.amount !== null && raw.decision.amount !== undefined ? amount : null,
            refundAmount: Number(raw.decision.refundAmount) || 0,
            refundManual: Boolean(raw.decision.refundManual),
          }
        : null,
  }
}

/** Die Prüfung ist durch: bestätigt oder entschieden — die Auszahlung ist frei. */
export function isReviewSettled(review: Pick<PerformanceReview, 'status'> | null): boolean {
  return !review || review.status === 'confirmed' || review.status === 'decided'
}

/** Belege als FormData-Felder `evidence`, wie das Backend sie erwartet. */
export function appendEvidence(form: FormData, files: File[] | undefined): void {
  for (const file of files ?? []) form.append('evidence', file)
}
