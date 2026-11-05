'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { X, Settings, Cookie } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocalePath } from '@/hooks/useLocalePath'

/**
 * Cookie- und Tracking-Einwilligung (§ 165 Abs. 3 TKG 2021, Art. 7 DSGVO).
 *
 * Regeln, die hier umgesetzt sind:
 *  - Vor einer Entscheidung ist alles Optionale aus. Der Google Tag Manager
 *    läuft mit Consent Mode v2 und dem Standard „denied" (siehe root-shell.tsx);
 *    erst `gtag('consent','update', …)` schaltet Analyse/Marketing frei.
 *  - „Alle akzeptieren" und „Nur notwendige" sind gleichwertig sichtbar.
 *  - Die Entscheidung lässt sich jederzeit über `openCookieSettings()` ändern
 *    (Footer, Einstellungen, Datenschutzerklärung).
 *  - Gespeichert wird nur die Entscheidung selbst (Cookie `syp_consent`,
 *    12 Monate, Secure auf HTTPS).
 */

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
    gtag?: (...args: unknown[]) => void
  }
}

export interface CookieSettings {
  necessary: boolean
  analytics: boolean
  marketing: boolean
}

export const CONSENT_COOKIE = 'syp_consent'
const OPEN_EVENT = 'syp:open-cookie-settings'
const CONSENT_VERSION = 2

/** Öffnet den Banner erneut, z. B. aus Footer oder Datenschutzerklärung. */
export function openCookieSettings(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(OPEN_EVENT))
  }
}

function generateUID(): string {
  const s = () => Math.random().toString(36).substring(2, 10)
  return `${s()}-${s()}-${s()}-${s()}`
}

export function readConsent(): CookieSettings | null {
  if (typeof document === 'undefined') return null
  const raw = document.cookie.split('; ').find(row => row.startsWith(`${CONSENT_COOKIE}=`))
  if (!raw) return null
  try {
    const payload = JSON.parse(decodeURIComponent(raw.split('=').slice(1).join('=')))
    const statistics: string[] = payload?.consents?.statistics ?? []
    const marketing: string[] = payload?.consents?.marketing ?? []
    return {
      necessary: true,
      analytics: statistics.includes('google-analytics'),
      marketing: marketing.includes('google-ads'),
    }
  } catch {
    return null
  }
}

function writeConsentCookie(settings: CookieSettings): void {
  const expires = new Date()
  expires.setDate(expires.getDate() + 365)
  const payload = {
    version: CONSENT_VERSION,
    consents: {
      essential: ['session-auth', 'language', 'consent'],
      statistics: settings.analytics ? ['google-analytics', 'google-tag-manager'] : [],
      marketing: settings.marketing ? ['google-ads', 'meta-pixel', 'google-adsense'] : [],
    },
    domainPath: `${window.location.hostname}/`,
    decidedAt: new Date().toISOString(),
    expires: expires.toUTCString(),
    uid: generateUID(),
  }
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(payload))}; max-age=${365 * 86400}; path=/; SameSite=Lax${secure}`
}

/** Consent Mode v2 + eigenes dataLayer-Event für die GTM-Trigger. */
function applyConsent(settings: CookieSettings): void {
  window.dataLayer = window.dataLayer || []
  const gtag =
    window.gtag ||
    function gtagFallback(...args: unknown[]) {
      // Gleiche Signatur wie das gtag-Snippet: `arguments` landet im dataLayer.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments as unknown as Record<string, unknown>)
    }
  gtag('consent', 'update', {
    analytics_storage: settings.analytics ? 'granted' : 'denied',
    ad_storage: settings.marketing ? 'granted' : 'denied',
    ad_user_data: settings.marketing ? 'granted' : 'denied',
    ad_personalization: settings.marketing ? 'granted' : 'denied',
  })
  window.dataLayer.push({
    event: 'cookie_consent_update',
    analytics_granted: settings.analytics,
    marketing_granted: settings.marketing,
  })
  if (settings.marketing) {
    const existing = document.getElementById('adsense-script')
    if (!existing) {
      const script = document.createElement('script')
      script.id = 'adsense-script'
      script.async = true
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3116707857823621'
      script.crossOrigin = 'anonymous'
      document.head.appendChild(script)
    }
  }
}

export default function CookieConsent() {
  const { t } = useTranslation()
  const localePath = useLocalePath()
  const [isVisible, setIsVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<CookieSettings>({
    necessary: true,
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    const saved = readConsent()
    if (!saved) {
      const timer = setTimeout(() => setIsVisible(true), 600)
      return () => clearTimeout(timer)
    }
    setSettings(saved)
    applyConsent(saved)
  }, [])

  useEffect(() => {
    const onOpen = () => {
      const saved = readConsent()
      if (saved) setSettings(saved)
      setShowSettings(true)
      setIsVisible(true)
    }
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [])

  const saveConsent = useCallback((consentSettings: CookieSettings) => {
    writeConsentCookie(consentSettings)
    applyConsent(consentSettings)
    setSettings(consentSettings)
    setIsVisible(false)
    setShowSettings(false)
  }, [])

  const handleAcceptAll = () => saveConsent({ necessary: true, analytics: true, marketing: true })
  const handleRejectOptional = () => saveConsent({ necessary: true, analytics: false, marketing: false })
  const handleSaveSettings = () => saveConsent(settings)

  if (!isVisible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
    >
      <div className="bg-card border rounded-lg shadow-xl w-full max-w-lg animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-primary" />
            <h2 id="cookie-consent-title" className="font-semibold">
              {t('cookie.title', { defaultValue: 'Datenschutz-Einstellungen' })}
            </h2>
          </div>
          <button
            onClick={handleRejectOptional}
            className="text-muted-foreground hover:text-foreground"
            aria-label={t('cookie.rejectOptional', { defaultValue: 'Nur notwendige' })}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {!showSettings ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {t('cookie.description', {
                  defaultValue:
                    'Wir verwenden technisch notwendige Cookies. Mit deiner Zustimmung setzen wir außerdem Analyse-Dienste (Google Analytics) und Marketing-Dienste (Google Ads, Meta Pixel, AdSense) ein, auch mit Datenübermittlung in die USA. Du kannst deine Auswahl jederzeit über „Cookie-Einstellungen" im Footer ändern.',
                })}
              </p>

              <div className="flex gap-4 text-sm mb-4">
                <Link href={localePath('/privacy')} className="text-primary hover:underline">
                  {t('legal.privacy', { defaultValue: 'Datenschutzerklärung' })}
                </Link>
                <Link href={localePath('/imprint')} className="text-primary hover:underline">
                  {t('legal.impressum', { defaultValue: 'Impressum' })}
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowSettings(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  {t('cookie.settings', { defaultValue: 'Einstellungen' })}
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleRejectOptional}>
                  {t('cookie.rejectOptional', { defaultValue: 'Nur notwendige' })}
                </Button>
                <Button className="flex-1 gradient-bg" onClick={handleAcceptAll}>
                  {t('cookie.acceptAll', { defaultValue: 'Alle akzeptieren' })}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4 mb-4">
                <div className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm">{t('cookie.necessary', { defaultValue: 'Notwendig' })}</h3>
                      <span className="text-xs text-muted-foreground">
                        ({t('cookie.required', { defaultValue: 'erforderlich' })})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('cookie.necessaryDesc', {
                        defaultValue:
                          'Anmeldung, Sprache, Sicherheit und das Speichern deiner Auswahl. Ohne diese Cookies funktioniert die Plattform nicht.',
                      })}
                    </p>
                  </div>
                  <input type="checkbox" checked disabled className="mt-1 h-4 w-4" aria-label="Notwendig" />
                </div>

                <div className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{t('cookie.analytics', { defaultValue: 'Analyse' })}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('cookie.analyticsDesc', {
                        defaultValue:
                          'Google Analytics 4: Nutzungsstatistiken mit gekürzter IP-Adresse, Übermittlung an Google (auch USA).',
                      })}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.analytics}
                    onChange={e => setSettings(prev => ({ ...prev, analytics: e.target.checked }))}
                    className="mt-1 h-4 w-4 accent-primary"
                    aria-label={t('cookie.analytics', { defaultValue: 'Analyse' })}
                  />
                </div>

                <div className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{t('cookie.marketing', { defaultValue: 'Marketing' })}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('cookie.marketingDesc', {
                        defaultValue:
                          'Google Ads, Meta Pixel und AdSense: Messung unserer Werbung und personalisierte Anzeigen, Übermittlung an Google und Meta (auch USA).',
                      })}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.marketing}
                    onChange={e => setSettings(prev => ({ ...prev, marketing: e.target.checked }))}
                    className="mt-1 h-4 w-4 accent-primary"
                    aria-label={t('cookie.marketing', { defaultValue: 'Marketing' })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleRejectOptional}>
                  {t('cookie.rejectOptional', { defaultValue: 'Nur notwendige' })}
                </Button>
                <Button className="flex-1 gradient-bg" onClick={handleSaveSettings}>
                  {t('cookie.save', { defaultValue: 'Auswahl speichern' })}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
