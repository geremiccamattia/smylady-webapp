'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { CONFIG, STORAGE_KEYS } from '@/lib/constants'

const CSV_TEMPLATE_URL = 'https://docs.google.com/spreadsheets/d/1YWqArillO-1ypGs6Yg9-q4nkhmCwUbupjQVCyUyOY-o/copy'

const CATEGORIES = ['Gastronomy', 'Business', 'Sports', 'Nature', 'Theme', 'Music', 'On the Roof', 'Clubbing', 'Workshop', 'Yoga', 'Other']
const PARTY_TYPES = ['birthday', 'wedding', 'corporate', 'social', 'other']
// `as const` ist Absicht: Erst dadurch entsteht ein Literal-Typ, den
// src/lib/musicTypes.guard.ts gegen MUSIC_TYPE_VALUES prüfen kann.
const MUSIC_TYPES = ['pop', 'rock', 'jazz', 'classical', 'electronic', 'hip_hop', 'techno', 'house', 'rnb', 'indie', 'dnb', 'dj_set', 'live_band', 'mixed', 'reggae', 'latin', 'afrobeats', 'soul', 'metal', 'country', 'trance', 'folk', 'no_music', 'other'] as const

/** Die in dieser Doku-Seite aufgeführten Musikrichtungen. Siehe musicTypes.guard.ts. */
export type ApiDocsMusicType = (typeof MUSIC_TYPES)[number]

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 whitespace-pre-wrap break-all max-w-full text-xs sm:text-sm">
      <code>{code}</code>
    </pre>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="text-2xl font-bold border-b pb-2">{title}</h2>
      {children}
    </section>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="rounded-xl border overflow-x-auto max-w-full">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-t ${i % 2 === 1 ? 'bg-muted/20' : ''}`}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
}

export default function ApiDocsPage() {
  const { t, i18n } = useTranslation()
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const { showAuthModal } = useAuthModal()
  const { toast } = useToast()

  const isEnglish = pathname.startsWith('/en') || i18n.language === 'en'

  const [token, setToken] = useState<string | null>(null)
  const [tokenCopied, setTokenCopied] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      setToken(localStorage.getItem(STORAGE_KEYS.TOKEN))
    } else {
      setToken(null)
    }
  }, [isAuthenticated])

  const handleCopyToken = async () => {
    if (!token) return
    try {
      await navigator.clipboard.writeText(token)
      setTokenCopied(true)
      toast({ title: t('api.copied', { defaultValue: '✓ Kopiert' }) })
      setTimeout(() => setTokenCopied(false), 2000)
    } catch {
      // clipboard API unavailable, ignore
    }
  }

  const tokenPlaceholder = token || (isEnglish ? 'YOUR_TOKEN' : 'DEIN_TOKEN')
  const baseUrl = CONFIG.API_URL

  const toc = [
    { id: 'auth', label: t('api.navAuth', { defaultValue: 'Authentifizierung' }) },
    { id: 'create-event', label: t('api.navCreateEvent', { defaultValue: 'Event erstellen' }) },
    { id: 'bulk-upload', label: t('api.navBulkUpload', { defaultValue: 'Bulk Upload (CSV)' }) },
    { id: 'update-event', label: t('api.navUpdateEvent', { defaultValue: 'Event aktualisieren' }) },
    { id: 'delete-event', label: t('api.navDeleteEvent', { defaultValue: 'Event löschen' }) },
    { id: 'my-events', label: t('api.navMyEvents', { defaultValue: 'Eigene Events abrufen' }) },
    { id: 'allowed-values', label: t('api.navAllowedValues', { defaultValue: 'Erlaubte Werte' }) },
    { id: 'troubleshooting', label: t('api.navTroubleshooting', { defaultValue: 'Fehlerbehebung' }) },
  ]

  const createEventCurl = `curl -X POST "${baseUrl}/events" \\
  -H "Authorization: Bearer ${tokenPlaceholder}" \\
  -F "name=Techno Night Vol. 5" \\
  -F "description=Die beste Techno Night in Wien!" \\
  -F "eventDate=2026-08-15T00:00:00.000Z" \\
  -F "eventStartTime=2026-08-15T16:00:00.000Z" \\
  -F "category=Music" \\
  -F "partyType=social" \\
  -F "musicType=techno" \\
  -F "locationName=Karlsplatz 1, 1010 Wien" \\
  -F "totalTickets=200" \\
  -F "price=15" \\
  -F "files=@event-bild.jpg"`

  const createEventResponse = `{
  "status": 201,
  "message": "Event created successfully",
  "data": {
    "_id": "6a5f1234abcd5678ef901234",
    "name": "Techno Night Vol. 5",
    "status": "Pending"
  }
}`

  const csvHeader = 'name,address,eventDate,eventStartTime,category,description,imageUrl,visibility,totalTickets,partyType,musicType,offerings,restrictions,price'

  const bulkUploadCurl = `curl -X POST "${baseUrl}/events/bulk-upload" \\
  -H "Authorization: Bearer ${tokenPlaceholder}" \\
  -F "file=@events.csv"`

  const bulkUploadSuccessResponse = `{
  "status": 201,
  "message": "Bulk upload completed",
  "data": {
    "created": 12,
    "failed": 0
  }
}`

  const bulkUploadErrorResponse = `{
  "status": 400,
  "message": "Bulk upload completed with errors",
  "data": {
    "created": 10,
    "failed": 2,
    "errors": [
      { "row": 4, "message": "eventDate is required" }
    ]
  }
}`

  const updateEventCurl = `curl -X PATCH "${baseUrl}/events/{EVENT_ID}" \\
  -H "Authorization: Bearer ${tokenPlaceholder}" \\
  -H "Content-Type: application/json" \\
  -d '{ "price": 20, "totalTickets": 250 }'`

  const deleteEventCurl = `curl -X DELETE "${baseUrl}/events/{EVENT_ID}" \\
  -H "Authorization: Bearer ${tokenPlaceholder}"`

  const myEventsCurl = `curl -X GET "${baseUrl}/events/my-events" \\
  -H "Authorization: Bearer ${tokenPlaceholder}"`

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 overflow-x-hidden">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          {t('api.heroTitle', { defaultValue: 'API-Dokumentation' })}
        </h1>
        <p className="text-muted-foreground text-lg mb-3">
          {t('api.heroSubtitle', { defaultValue: 'Events automatisiert erstellen und verwalten' })}
        </p>
        <a
          href="/openapi.json"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline font-medium"
        >
          {t('api.openApiSpecLabel', { defaultValue: 'OpenAPI-Spezifikation (openapi.json)' })} →
        </a>
      </div>

      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
        {/* TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-2">
            <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {t('api.tocTitle', { defaultValue: 'Inhalt' })}
            </p>
            <nav className="flex flex-col space-y-1">
              {toc.map(item => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-sm text-muted-foreground hover:text-foreground py-1"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="space-y-12">
          {/* Base URL box */}
          <div className="p-4 rounded-xl border bg-primary/5 border-primary/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              {t('api.baseUrlLabel', { defaultValue: 'Base URL' })}
            </p>
            <Code>{baseUrl}</Code>
          </div>

          {/* Mobile TOC */}
          <nav className="lg:hidden flex flex-wrap gap-2">
            {toc.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="text-xs px-3 py-1.5 rounded-full border bg-muted/40 hover:bg-muted"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* 1. Auth */}
          <Section id="auth" title={t('api.authTitle', { defaultValue: '1. Authentifizierung' })}>
            <p className="text-muted-foreground">
              {t('api.authIntro', { defaultValue: 'Alle API-Aufrufe benötigen einen Bearer Token im Header:' })}
            </p>
            <CodeBlock code={`Authorization: Bearer ${tokenPlaceholder}`} />

            {token ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {t('api.yourToken', { defaultValue: 'Dein API-Token:' })}
                </p>
                <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-3">
                  <code className="text-green-400 text-sm break-all flex-1 select-all">
                    {token}
                  </code>
                  <button
                    onClick={handleCopyToken}
                    className="shrink-0 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-sm"
                  >
                    {tokenCopied
                      ? t('api.copied', { defaultValue: '✓ Kopiert' })
                      : t('api.copy', { defaultValue: 'Kopieren' })}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('api.tokenExpiry', { defaultValue: 'Gültig für 7 Tage. Nach Ablauf erneut einloggen und diese Seite neu laden.' })}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('api.loginForToken', { defaultValue: 'Logge dich ein um deinen API-Token zu sehen.' })}
                </p>
                <Button variant="outline" onClick={() => showAuthModal()}>
                  {t('api.login', { defaultValue: 'Anmelden' })}
                </Button>
                <div>
                  <p className="text-sm font-medium mb-1">
                    {t('api.authHowTo', { defaultValue: 'So erhältst du den Token:' })}
                  </p>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                    <li>{t('api.authStep1', { defaultValue: 'Logge dich auf shareyourparty.de ein' })}</li>
                    <li>{t('api.authStep2', { defaultValue: 'Öffne die Browser-Entwicklertools (F12) → Application → Local Storage' })}</li>
                    <li>{t('api.authStep3', { defaultValue: 'Kopiere den Wert von syp_token' })}</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('api.authNote', { defaultValue: 'Hinweis: Der Token ist 7 Tage gültig.' })}
                  </p>
                </div>
              </div>
            )}
          </Section>

          {/* 2. Create Event */}
          <Section id="create-event" title={t('api.createEventTitle', { defaultValue: '2. Event erstellen' })}>
            <p>
              <Code>POST /events</Code>
              <span className="text-muted-foreground text-sm ml-2">Content-Type: multipart/form-data</span>
            </p>

            <div>
              <h3 className="font-semibold mb-2">{t('api.requiredFields', { defaultValue: 'Pflichtfelder' })}</h3>
              <Table
                headers={[
                  t('api.colField', { defaultValue: 'Feld' }),
                  t('api.colType', { defaultValue: 'Typ' }),
                  t('api.colDescription', { defaultValue: 'Beschreibung' }),
                  t('api.colExample', { defaultValue: 'Beispiel' }),
                ]}
                rows={[
                  [<Code>name</Code>, 'String', t('api.fieldNameDesc', { defaultValue: 'Event-Name' }), <Code>"Techno Night Vol. 5"</Code>],
                  [<Code>description</Code>, 'String', t('api.fieldDescriptionDesc', { defaultValue: 'Beschreibung' }), <Code>"Die beste Techno Night!"</Code>],
                  [<Code>eventDate</Code>, 'ISO Date', t('api.fieldEventDateDesc', { defaultValue: 'Datum' }), <Code>"2026-08-15T00:00:00.000Z"</Code>],
                  [<Code>eventStartTime</Code>, 'ISO Date', t('api.fieldEventStartTimeDesc', { defaultValue: 'Datum + Uhrzeit' }), <Code>"2026-08-15T16:00:00.000Z"</Code>],
                  [<Code>category</Code>, 'String', t('api.fieldCategoryDesc', { defaultValue: 'Kategorie' }), <Code>"Music"</Code>],
                  [<Code>partyType</Code>, 'String', t('api.fieldPartyTypeDesc', { defaultValue: 'Event-Typ' }), <Code>"social"</Code>],
                  [<Code>musicType</Code>, 'String', t('api.fieldMusicTypeDesc', { defaultValue: 'Musik-Typ' }), <Code>"techno"</Code>],
                  [<Code>locationName</Code>, 'String', t('api.fieldLocationNameDesc', { defaultValue: 'Adresse' }), <Code>"Karlsplatz 1, 1010 Wien"</Code>],
                ]}
              />
            </div>

            <div>
              <h3 className="font-semibold mb-2">{t('api.optionalFields', { defaultValue: 'Optionale Felder' })}</h3>
              <Table
                headers={[
                  t('api.colField', { defaultValue: 'Feld' }),
                  t('api.colType', { defaultValue: 'Typ' }),
                  t('api.colDefault', { defaultValue: 'Default' }),
                  t('api.colDescription', { defaultValue: 'Beschreibung' }),
                ]}
                rows={[
                  [<Code>totalTickets</Code>, 'Number', <Code>1</Code>, t('api.fieldTotalTicketsDesc', { defaultValue: 'Anzahl Tickets' })],
                  [<Code>price</Code>, 'Number', <Code>0</Code>, t('api.fieldPriceDesc', { defaultValue: 'Preis in Euro (0 = kostenlos)' })],
                  [<Code>visibility</Code>, 'String', <Code>"public"</Code>, t('api.fieldVisibilityDesc', { defaultValue: '"public", "subscribers", "selected"' })],
                  [<Code>offerings</Code>, 'String', <Code>""</Code>, t('api.fieldOfferingsDesc', { defaultValue: 'Angebot' })],
                  [<Code>restrictions</Code>, 'String', <Code>""</Code>, t('api.fieldRestrictionsDesc', { defaultValue: 'Einschränkungen' })],
                  [<Code>locationType</Code>, 'String', <Code>"physical"</Code>, t('api.fieldLocationTypeDesc', { defaultValue: '"physical", "online", "tba"' })],
                  [<Code>onlineUrl</Code>, 'String', <Code>""</Code>, t('api.fieldOnlineUrlDesc', { defaultValue: 'Link zum Online-Event' })],
                  [<Code>paymentType</Code>, 'String', <Code>"online"</Code>, t('api.fieldPaymentTypeDesc', { defaultValue: '"online" oder "door"' })],
                  [<Code>files</Code>, 'File(s)', '—', t('api.fieldFilesDesc', { defaultValue: 'Bilder (max 5, JPG/PNG)' })],
                ]}
              />
            </div>

            <div>
              <h3 className="font-semibold mb-2">{t('api.curlExampleLabel', { defaultValue: 'Beispiel' })}</h3>
              <CodeBlock code={createEventCurl} />
            </div>

            <div className="p-4 rounded-xl border bg-muted/30 text-sm text-muted-foreground break-words">
              {t('api.timeNote', { defaultValue: 'eventStartTime ist in UTC. Für ein Event um 18:00 Wiener Zeit, sende 16:00 UTC (Sommer, CEST) bzw. 17:00 UTC (Winter, CET).' })}
            </div>

            <div>
              <h3 className="font-semibold mb-2">{t('api.responseExampleLabel', { defaultValue: 'Antwort-Beispiel' })}</h3>
              <CodeBlock code={createEventResponse} />
            </div>

            <p className="text-sm text-muted-foreground">
              {t('api.createEventReviewNote', { defaultValue: 'Events werden nach Erstellung geprüft und freigeschaltet.' })}
            </p>
          </Section>

          {/* 3. Bulk Upload */}
          <Section id="bulk-upload" title={t('api.bulkUploadTitle', { defaultValue: '3. Bulk Upload (CSV)' })}>
            <p>
              <Code>POST /events/bulk-upload</Code>
              <span className="text-muted-foreground text-sm ml-2">Content-Type: multipart/form-data</span>
            </p>

            <div>
              <h3 className="font-semibold mb-2">{t('api.csvHeaderTitle', { defaultValue: 'CSV-Header' })}</h3>
              <CodeBlock code={csvHeader} />
            </div>

            <div>
              <h3 className="font-semibold mb-2">{t('api.csvFieldsTitle', { defaultValue: 'CSV-Felder' })}</h3>
              <Table
                headers={[
                  t('api.colColumn', { defaultValue: 'Spalte' }),
                  t('api.colRequired', { defaultValue: 'Pflicht' }),
                  t('api.colDescription', { defaultValue: 'Beschreibung' }),
                  t('api.colExample', { defaultValue: 'Beispiel' }),
                ]}
                rows={[
                  [<Code>name</Code>, t('common.yes', { defaultValue: 'Ja' }), t('api.csvFieldNameDesc', { defaultValue: 'Event-Name' }), <Code>Techno Night</Code>],
                  [<Code>address</Code>, t('common.yes', { defaultValue: 'Ja' }), t('api.csvFieldAddressDesc', { defaultValue: 'Adresse' }), <Code>Karlsplatz 1, Wien</Code>],
                  [<Code>eventDate</Code>, t('common.yes', { defaultValue: 'Ja' }), t('api.csvFieldEventDateDesc', { defaultValue: 'Datum (YYYY-MM-DD)' }), <Code>2026-08-15</Code>],
                  [<Code>eventStartTime</Code>, t('common.yes', { defaultValue: 'Ja' }), t('api.csvFieldEventStartTimeDesc', { defaultValue: 'Datum + Uhrzeit (ISO)' }), <Code>2026-08-15T19:00:00</Code>],
                  [<Code>category</Code>, t('common.yes', { defaultValue: 'Ja' }), t('api.csvFieldCategoryDesc', { defaultValue: 'Kategorie' }), <Code>Music</Code>],
                  [<Code>description</Code>, t('common.yes', { defaultValue: 'Ja' }), t('api.csvFieldDescriptionDesc', { defaultValue: 'Beschreibung' }), <Code>Die beste Night!</Code>],
                  [<Code>imageUrl</Code>, t('common.yes', { defaultValue: 'Ja' }), t('api.csvFieldImageUrlDesc', { defaultValue: 'Bild-URL' }), <Code>https://example.com/bild.jpg</Code>],
                  [<Code>visibility</Code>, t('common.no', { defaultValue: 'Nein' }), t('api.csvFieldVisibilityDesc', { defaultValue: 'Default: public' }), <Code>public</Code>],
                  [<Code>totalTickets</Code>, t('common.no', { defaultValue: 'Nein' }), t('api.csvFieldTotalTicketsDesc', { defaultValue: 'Anzahl' }), <Code>200</Code>],
                  [<Code>partyType</Code>, t('common.no', { defaultValue: 'Nein' }), t('api.csvFieldPartyTypeDesc', { defaultValue: 'Default: social' }), <Code>social</Code>],
                  [<Code>musicType</Code>, t('common.no', { defaultValue: 'Nein' }), t('api.csvFieldMusicTypeDesc', { defaultValue: 'Default: other' }), <Code>techno</Code>],
                  [<Code>offerings</Code>, t('common.no', { defaultValue: 'Nein' }), t('api.csvFieldOfferingsDesc', { defaultValue: 'Angebot' }), <Code>Drinks</Code>],
                  [<Code>restrictions</Code>, t('common.no', { defaultValue: 'Nein' }), t('api.csvFieldRestrictionsDesc', { defaultValue: 'Einschränkungen' }), <Code>Ab 18</Code>],
                  [<Code>price</Code>, t('common.no', { defaultValue: 'Nein' }), t('api.csvFieldPriceDesc', { defaultValue: 'Preis (Default: 0)' }), <Code>15</Code>],
                ]}
              />
            </div>

            <p className="text-sm">
              <a
                href={CSV_TEMPLATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                {t('api.csvTemplateLabel', { defaultValue: 'CSV-Vorlage' })} →
              </a>
            </p>

            <div>
              <h3 className="font-semibold mb-2">{t('api.curlExampleLabel', { defaultValue: 'Beispiel' })}</h3>
              <CodeBlock code={bulkUploadCurl} />
            </div>

            <div>
              <h3 className="font-semibold mb-2">{t('api.csvSuccessResponseLabel', { defaultValue: 'Antwort bei Erfolg' })}</h3>
              <CodeBlock code={bulkUploadSuccessResponse} />
            </div>

            <div>
              <h3 className="font-semibold mb-2">{t('api.csvErrorResponseLabel', { defaultValue: 'Antwort bei Fehler' })}</h3>
              <CodeBlock code={bulkUploadErrorResponse} />
            </div>
          </Section>

          {/* 4. Update Event */}
          <Section id="update-event" title={t('api.updateEventTitle', { defaultValue: '4. Event aktualisieren' })}>
            <p>
              <Code>PATCH /events/:id</Code>
              <span className="text-muted-foreground text-sm ml-2">
                — {t('api.updateEventDesc', { defaultValue: 'Nur geänderte Felder senden.' })}
              </span>
            </p>
            <div className="p-4 rounded-xl border bg-muted/30 text-sm text-muted-foreground break-words">
              {t('api.fullEventIdNote', { defaultValue: 'Verwende die vollständige Event-ID (24 Zeichen) aus der Antwort beim Erstellen oder von GET /events/my-events. Die gekürzte ID aus der Event-URL reicht nicht aus.' })}
            </div>
            <CodeBlock code={updateEventCurl} />
          </Section>

          {/* 5. Delete Event */}
          <Section id="delete-event" title={t('api.deleteEventTitle', { defaultValue: '5. Event löschen' })}>
            <p><Code>DELETE /events/:id</Code></p>
            <div className="p-4 rounded-xl border bg-muted/30 text-sm text-muted-foreground break-words">
              {t('api.fullEventIdNote', { defaultValue: 'Verwende die vollständige Event-ID (24 Zeichen) aus der Antwort beim Erstellen oder von GET /events/my-events. Die gekürzte ID aus der Event-URL reicht nicht aus.' })}
            </div>
            <CodeBlock code={deleteEventCurl} />
          </Section>

          {/* 6. My Events */}
          <Section id="my-events" title={t('api.myEventsTitle', { defaultValue: '6. Eigene Events abrufen' })}>
            <p><Code>GET /events/my-events</Code></p>
            <CodeBlock code={myEventsCurl} />
          </Section>

          {/* 7. Allowed Values */}
          <Section id="allowed-values" title={t('api.allowedValuesTitle', { defaultValue: '7. Erlaubte Werte' })}>
            <div>
              <h3 className="font-semibold mb-2">{t('api.categoriesLabel', { defaultValue: 'Kategorien (category)' })}</h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => <Code key={c}>{c}</Code>)}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t('api.partyTypesLabel', { defaultValue: 'Event-Typen (partyType)' })}</h3>
              <div className="flex flex-wrap gap-2">
                {PARTY_TYPES.map(c => <Code key={c}>{c}</Code>)}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t('api.musicTypesLabel', { defaultValue: 'Musik-Typen (musicType)' })}</h3>
              <div className="flex flex-wrap gap-2">
                {MUSIC_TYPES.map(c => <Code key={c}>{c}</Code>)}
              </div>
            </div>
          </Section>

          {/* 8. Troubleshooting */}
          <Section id="troubleshooting" title={t('api.troubleshootingTitle', { defaultValue: '8. Fehlerbehebung' })}>
            <Table
              headers={[
                t('api.colCode', { defaultValue: 'Code' }),
                t('api.colCause', { defaultValue: 'Ursache' }),
                t('api.colSolution', { defaultValue: 'Lösung' }),
              ]}
              rows={[
                [<Code>401</Code>, t('api.errorMissingTokenCause', { defaultValue: 'Token fehlt/abgelaufen' }), t('api.errorMissingTokenSolution', { defaultValue: 'Neuen Token holen' })],
                [<Code>403</Code>, t('api.errorNoPermissionCause', { defaultValue: 'Keine Berechtigung' }), t('api.errorNoPermissionSolution', { defaultValue: 'Organizer-Rolle prüfen' })],
                [<Code>400</Code>, t('api.errorMissingFieldCause', { defaultValue: 'Pflichtfeld fehlt' }), t('api.errorMissingFieldSolution', { defaultValue: 'Fehlermeldung prüfen' })],
                [<Code>500</Code>, t('api.errorServerCause', { defaultValue: 'Serverfehler' }), <a href="mailto:office@shareyourparty.de" className="text-primary hover:underline">office@shareyourparty.de</a>],
              ]}
            />
          </Section>

          {/* Footer */}
          <div className="pt-6 border-t text-sm text-muted-foreground">
            {t('api.footerQuestions', { defaultValue: 'Bei Fragen:' })}{' '}
            <a href="mailto:office@shareyourparty.de" className="text-primary hover:underline">
              office@shareyourparty.de
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
