'use client'

import { useTranslation } from 'react-i18next'
import LegalDocumentView from '@/components/legal/LegalDocumentView'
import { getTerms } from '@/lib/legal'

/**
 * AGB. Der Text liegt in src/lib/legal/terms.de.ts und terms.en.ts und wird
 * dort gepflegt; diese Datei rendert ihn nur.
 */
export default function Terms({ lang }: { lang?: 'de' | 'en' }) {
  const { i18n } = useTranslation()
  // Die Route (/terms bzw. /en/terms) bestimmt die Sprache; i18n ist nur Rückfall.
  return <LegalDocumentView document={getTerms(lang ?? i18n.language)} />
}
