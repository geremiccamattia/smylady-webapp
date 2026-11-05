'use client'

import { useTranslation } from 'react-i18next'
import LegalDocumentView from '@/components/legal/LegalDocumentView'
import { getImprintDocument } from '@/lib/legal'

/**
 * Impressum nach § 5 ECG und § 25 MedienG. Betreiberdaten stehen zentral in
 * src/lib/legal/operator.ts.
 */
export default function Impressum({ lang }: { lang?: 'de' | 'en' }) {
  const { i18n } = useTranslation()
  return <LegalDocumentView document={getImprintDocument(lang ?? i18n.language)} />
}
