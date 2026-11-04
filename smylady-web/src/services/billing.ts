'use client'

/**
 * Rechnungen und Auszahlungsbelege.
 *
 * Creator: Abrechnungsdaten (Name und Anschrift für den Auszahlungsbeleg,
 * freiwillig UID und Steuernummer zum Aufdrucken) und die eigenen
 * Auszahlungsbelege. Keine Steuerlogik: Für seine Steuern ist der Creator
 * selbst verantwortlich. Den Beleg stellt Share Your Party mit der
 * Auszahlung aus — über den ausgezahlten Betrag. Fehlen die Abrechnungsdaten,
 * wartet er ('pending_billing_data') und wird ausgestellt, sobald der
 * Creator sie speichert. Technisch heisst die Art weiterhin
 * 'creator_credit_note'.
 *
 * Brand: die eigene Rechnung von Share Your Party zum Auftrag (ab dem
 * Zahlungseingang) und Rechnungskorrekturen bei einer Erstattung.
 *
 * PDFs gibt es nur über einen kurzlebigen Link (10 Minuten), den das Backend
 * auf POST …/download-link ausgibt: Die URL liefert das PDF ohne Anmeldung,
 * damit es im Browser und in der App gleich funktioniert.
 */

import { apiClient } from './api'
import { CONFIG } from '@/lib/constants'

export interface CreatorBilling {
  /** Vor- und Nachname bzw. Firmenwortlaut. */
  legalName: string
  /** Zusatzzeile, z. B. Firmenname. */
  companyName?: string
  street: string
  postalCode: string
  city: string
  /** ISO-3166 alpha-2 in Grossbuchstaben, z. B. 'AT'. */
  country: string
  /** UID, freiwillig, nur zum Aufdrucken. */
  vatId?: string
  /** Steuernummer, freiwillig, nur zum Aufdrucken. */
  taxNumber?: string
}

/** Was PUT /creators/me/billing und die Bewerbung annehmen. */
export type CreatorBillingInput = CreatorBilling

export interface CreatorBillingState {
  billing: CreatorBilling | null
  complete: boolean
  /** Fehlende Pflichtfelder, z. B. ['street']. */
  missing: string[]
}

export type BillingDocumentKind = 'brand_invoice' | 'brand_invoice_correction' | 'creator_credit_note'
export type BillingDocumentStatus = 'issued' | 'pending_billing_data'

export interface BillingDocumentSummary {
  id: string
  kind: BillingDocumentKind
  /** 'pending_billing_data' nur bei Auszahlungsbelegen. */
  status: BillingDocumentStatus
  /** 'RE-…', 'RK-…', 'AB-…'; null, solange der Auszahlungsbeleg wartet. */
  number: string | null
  issuedAt: string | null
  orderId: string
  assignmentId?: string
  /** Auftragstitel. */
  title: string
  /** EUR, bei einer Korrektur negativ. */
  grossAmount: number
  netAmount: number
  vatAmount: number
  vatRate: number
  currency: 'EUR'
  /** Bei einer Korrektur: Nummer der korrigierten Rechnung. */
  refersToNumber?: string
  emailedAt?: string
}

export interface BillingDownloadLink {
  url: string
  expiresAt: string
}

/** Grenzen wie im Backend (CreatorBilling-DTO). */
export const BILLING_LIMITS = {
  legalName: 200,
  companyName: 200,
  street: 200,
  postalCode: 20,
  city: 100,
  vatId: 20,
  taxNumber: 40,
} as const

/**
 * Länder für die Abrechnungsdaten: zuerst die drei, in denen fast alle
 * Creator sitzen, dann die übrigen EU-Länder. Die Namen kommen aus
 * Intl.DisplayNames in der Sprache der App.
 */
export const BILLING_PRIMARY_COUNTRIES = ['AT', 'DE', 'CH'] as const
export const BILLING_OTHER_COUNTRIES = [
  'BE', 'BG', 'CY', 'CZ', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE',
  'IT', 'LI', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
] as const

const text = (value: unknown): string => (typeof value === 'string' ? value : value == null ? '' : String(value))
const num = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const unwrapData = (response: { data?: any }): any => response.data?.data ?? response.data

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBilling(raw: any): CreatorBilling | null {
  if (!raw || typeof raw !== 'object') return null
  return {
    legalName: text(raw.legalName),
    companyName: text(raw.companyName) || undefined,
    street: text(raw.street),
    postalCode: text(raw.postalCode),
    city: text(raw.city),
    country: text(raw.country).toUpperCase(),
    vatId: text(raw.vatId) || undefined,
    taxNumber: text(raw.taxNumber) || undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBillingState(raw: any): CreatorBillingState {
  return {
    billing: mapBilling(raw?.billing),
    complete: Boolean(raw?.complete),
    missing: Array.isArray(raw?.missing) ? raw.missing.map(text) : [],
  }
}

const DOCUMENT_KINDS: readonly string[] = ['brand_invoice', 'brand_invoice_correction', 'creator_credit_note']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBillingDocument(raw: any): BillingDocumentSummary {
  return {
    id: text(raw?.id || raw?._id),
    kind: (DOCUMENT_KINDS.includes(raw?.kind) ? raw.kind : 'brand_invoice') as BillingDocumentKind,
    status: raw?.status === 'pending_billing_data' ? 'pending_billing_data' : 'issued',
    number: text(raw?.number) || null,
    issuedAt: text(raw?.issuedAt) || null,
    orderId: text(raw?.orderId),
    assignmentId: text(raw?.assignmentId) || undefined,
    title: text(raw?.title),
    grossAmount: num(raw?.grossAmount),
    netAmount: num(raw?.netAmount),
    vatAmount: num(raw?.vatAmount),
    vatRate: num(raw?.vatRate),
    currency: 'EUR',
    refersToNumber: text(raw?.refersToNumber) || undefined,
    emailedAt: text(raw?.emailedAt) || undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDocuments = (data: any): BillingDocumentSummary[] =>
  Array.isArray(data) ? data.map(mapBillingDocument).filter((doc) => doc.id) : []

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDownloadLink(raw: any): BillingDownloadLink {
  return { url: text(raw?.url), expiresAt: text(raw?.expiresAt) }
}

export const billingService = {
  /** Eigene Abrechnungsdaten; billing ist null, solange keine hinterlegt sind. */
  async getCreatorBilling(): Promise<CreatorBillingState> {
    const response = await apiClient.get('/creators/me/billing')
    return mapBillingState(unwrapData(response))
  },

  /** 400 bei ungültigen Feldern, die Meldung (deutsch) steht in `message`. */
  async saveCreatorBilling(payload: CreatorBillingInput): Promise<CreatorBillingState> {
    const response = await apiClient.put('/creators/me/billing', payload)
    return mapBillingState(unwrapData(response))
  },

  /** Eigene Auszahlungsbelege, auch die wartenden; optional nur zu einem Auftrag. */
  async listCreatorBillingDocuments(assignmentId?: string): Promise<BillingDocumentSummary[]> {
    const response = await apiClient.get('/creators/me/billing-documents', {
      params: assignmentId ? { assignmentId } : undefined,
    })
    return mapDocuments(unwrapData(response))
  },

  async creatorDocumentDownloadLink(docId: string): Promise<BillingDownloadLink> {
    const response = await apiClient.post(`/creators/me/billing-documents/${encodeURIComponent(docId)}/download-link`)
    return mapDownloadLink(unwrapData(response))
  },

  /** Rechnung und Korrekturen zu einem Brand-Auftrag. */
  async listBrandOrderBillingDocuments(orderId: string): Promise<BillingDocumentSummary[]> {
    const response = await apiClient.get(`/brand-orders/${encodeURIComponent(orderId)}/billing-documents`)
    return mapDocuments(unwrapData(response))
  },

  async brandDocumentDownloadLink(orderId: string, docId: string): Promise<BillingDownloadLink> {
    const response = await apiClient.post(
      `/brand-orders/${encodeURIComponent(orderId)}/billing-documents/${encodeURIComponent(docId)}/download-link`,
    )
    return mapDownloadLink(unwrapData(response))
  },
}

/** Einzelne Funktionen, wie in der Absprache benannt. */
export const {
  getCreatorBilling,
  saveCreatorBilling,
  listCreatorBillingDocuments,
  creatorDocumentDownloadLink,
  listBrandOrderBillingDocuments,
  brandDocumentDownloadLink,
} = billingService

/**
 * Nur Links zum eigenen Backend: HTTPS (http nur lokal) und der Host der API
 * oder unserer bekannten Backend-Domains. Ein manipulierter Response soll
 * keinen fremden Tab öffnen können.
 */
export function isSafeBillingDownloadUrl(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  const host = parsed.hostname.toLowerCase()
  const local = host === 'localhost' || host === '127.0.0.1'
  if (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) return false

  let apiHost = ''
  try {
    apiHost = new URL(CONFIG.API_URL).hostname.toLowerCase()
  } catch {
    apiHost = ''
  }
  const allowed = [apiHost, 'shareyourparty.de', 'onrender.com'].filter(Boolean)
  return local || allowed.some((entry) => host === entry || host.endsWith(`.${entry}`))
}
