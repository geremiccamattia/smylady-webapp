'use client'

import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import LegalDocumentView from '@/components/legal/LegalDocumentView'
import { openCookieSettings } from '@/components/CookieConsent'
import { getPrivacy } from '@/lib/legal'

/**
 * Datenschutzerklärung. Der Text liegt in src/lib/legal/privacy.de.ts und
 * privacy.en.ts. Zusätzlich gibt es hier den Einstieg in die
 * Cookie-Einstellungen, damit Einwilligungen so leicht widerrufen werden
 * können, wie sie erteilt wurden (Art. 7 Abs. 3 DSGVO).
 */
export default function Privacy({ lang }: { lang?: 'de' | 'en' }) {
  const { i18n, t } = useTranslation()
  return (
    <LegalDocumentView document={getPrivacy(lang ?? i18n.language)}>
      <div className="mb-8">
        <Button variant="outline" onClick={() => openCookieSettings()}>
          {t('legal.cookieSettings', { defaultValue: 'Cookie-Einstellungen' })}
        </Button>
      </div>
    </LegalDocumentView>
  )
}
