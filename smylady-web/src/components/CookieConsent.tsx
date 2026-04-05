import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Settings, Cookie } from 'lucide-react'
import { Button } from '@/components/ui/button'

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

interface CookieSettings {
  necessary: boolean
  analytics: boolean
  marketing: boolean
}


function generateUID(): string {
  const s = () => Math.random().toString(36).substring(2, 10)
  return `${s()}-${s()}-${s()}-${s()}`
}

function writeConsentCookie(settings: CookieSettings): void {
  const expires = new Date()
  expires.setDate(expires.getDate() + 365)
  const payload = {
    consents: {
      essential: ['session-auth'],
      statistics: settings.analytics ? ['google-analytics', 'google-tag-manager'] : [],
      marketing: settings.marketing ? ['google-ads'] : [],
    },
    domainPath: `${window.location.hostname}/`,
    expires: expires.toUTCString(),
    uid: generateUID(),
  }
  document.cookie = `syp_consent=${encodeURIComponent(JSON.stringify(payload))}; max-age=${365 * 86400}; path=/; SameSite=Lax`
}

function readConsentCookie(): boolean {
  return document.cookie.split('; ').some(row => row.startsWith('syp_consent='))
}

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<CookieSettings>({
    necessary: true, // Always required
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    // Check if user has already given consent
    const savedConsent = readConsentCookie()
    if (!savedConsent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
    const raw = document.cookie.split('; ').find(row => row.startsWith('syp_consent='))
    if (raw) {
      try {
        const payload = JSON.parse(decodeURIComponent(raw.split('=').slice(1).join('=')))
        const statistics: string[] = payload?.consents?.statistics ?? []
        const marketing: string[] = payload?.consents?.marketing ?? []
        window.dataLayer = window.dataLayer || []
        window.dataLayer.push({
          event: 'cookie_consent_update',
          analytics_granted: statistics.includes('google-analytics'),
          marketing_granted: marketing.includes('google-ads'),
        })
      } catch {
        // malformed cookie — ignore
      }
    }
  }, [])

  const saveConsent = (consentSettings: CookieSettings) => {
    writeConsentCookie(consentSettings)
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: 'cookie_consent_update',
      analytics_granted: consentSettings.analytics,
      marketing_granted: consentSettings.marketing,
    })
    setIsVisible(false)
  }

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true
    })
  }

  const handleRejectOptional = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false
    })
  }

  const handleSaveSettings = () => {
    saveConsent(settings)
    setShowSettings(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div className="bg-card border rounded-lg shadow-xl w-full max-w-lg animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Datenschutz-Einstellungen</h2>
          </div>
          <button
            onClick={handleRejectOptional}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!showSettings ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Wir verwenden Cookies und ähnliche Technologien, um dir die bestmögliche Erfahrung
                zu bieten. Einige davon sind für die Nutzung der App notwendig, während andere uns
                helfen, dein Erlebnis zu verbessern.
              </p>

              {/* Quick Links */}
              <div className="flex gap-4 text-sm mb-4">
                <Link to="/privacy" className="text-primary hover:underline">
                  Datenschutzerklärung
                </Link>
                <Link to="/imprint" className="text-primary hover:underline">
                  Impressum
                </Link>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Einstellungen
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleRejectOptional}
                >
                  Nur notwendige
                </Button>
                <Button
                  className="flex-1 gradient-bg"
                  onClick={handleAcceptAll}
                >
                  Alle akzeptieren
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Settings View */}
              <div className="space-y-4 mb-4">
                {/* Necessary */}
                <div className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm">Notwendig</h3>
                      <span className="text-xs text-muted-foreground">(erforderlich)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Diese Cookies sind für die Grundfunktionen der App erforderlich und können nicht deaktiviert werden.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="mt-1 h-4 w-4"
                  />
                </div>

                {/* Analytics */}
                <div className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">Analyse</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hilft uns zu verstehen, wie du die App nutzt, um sie zu verbessern.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.analytics}
                    onChange={(e) => setSettings(prev => ({ ...prev, analytics: e.target.checked }))}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                </div>

                {/* Marketing */}
                <div className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">Marketing</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Wird für personalisierte Werbung und zur Messung der Werbewirksamkeit verwendet.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.marketing}
                    onChange={(e) => setSettings(prev => ({ ...prev, marketing: e.target.checked }))}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSettings(false)}
                >
                  Zurück
                </Button>
                <Button
                  className="flex-1 gradient-bg"
                  onClick={handleSaveSettings}
                >
                  Einstellungen speichern
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
