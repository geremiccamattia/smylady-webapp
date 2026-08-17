'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { eventsService } from '@/services/events'
import { useLocalePath } from '@/hooks/useLocalePath'
import { isMultiDayEvent } from '@/lib/utils'

interface RaffleTermsPageProps {
  /** Slug bzw. ID aus der URL — exakt der Wert, der auch die Event-Detailseite lädt. */
  eventSlug: string
}

export default function RaffleTermsPage({ eventSlug }: RaffleTermsPageProps) {
  const { t, i18n } = useTranslation()
  const localePath = useLocalePath()

  // Bewusst der öffentliche Endpoint: Teilnahmebedingungen müssen auch ohne Login
  // (und für Suchmaschinen) erreichbar sein.
  const { data: event, isLoading } = useQuery({
    queryKey: ['publicEvent', eventSlug],
    queryFn: () => eventsService.getPublicEventById(eventSlug),
    enabled: !!eventSlug,
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-40 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!event || !event.isRaffle) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <p className="text-muted-foreground">
          {t('raffleTerms.notFound', { defaultValue: 'Dieses Event ist kein Gewinnspiel.' })}
        </p>
        {event && (
          <Link
            href={localePath(`/event/${eventSlug}`)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('raffleTerms.backToEvent', { defaultValue: 'Zurück zum Event' })}
          </Link>
        )}
      </div>
    )
  }

  const isEnglish = !!i18n.language?.startsWith('en')
  const dateLocale = isEnglish ? 'en-GB' : 'de-AT'
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(dateLocale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  // eventEndTime ist immer gesetzt (Default: Start + 4h). Ein Datumsbereich wird
  // deshalb nur bei echten Mehrtages-Events ausgegeben, sonst stünde dort zweimal
  // dasselbe Datum.
  const eventDateRange = isMultiDayEvent(event.eventDate, event.eventEndTime)
    ? `${formatDate(event.eventDate)} – ${formatDate(event.eventEndTime)}`
    : formatDate(event.eventDate)

  // Der Ziehungstermin kommt ausschließlich aus dem Event-Feld raffleDrawDate.
  // Die Bedingungen sind rechtlich relevant — ein zweiter, fest verdrahteter Termin
  // könnte von der Event-Anzeige abweichen. Zeitzone fix Europe/Vienna, damit der
  // Termin nicht je nach Gerät des Lesers wandert.
  const drawDate = event.raffleDrawDate
    ? t('raffleTerms.drawDateFormat', {
        date: new Date(event.raffleDrawDate).toLocaleDateString(dateLocale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'Europe/Vienna',
        }),
        time: new Date(event.raffleDrawDate).toLocaleTimeString(isEnglish ? 'en-US' : 'de-AT', {
          hour: isEnglish ? 'numeric' : '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Vienna',
        }),
        defaultValue: '{{date}} um {{time}} Uhr',
      })
    : null

  const eventName = event.name
  const prize = event.rafflePrize || t('raffle.prizeFallback', { defaultValue: 'Tolle Preise zu gewinnen!' })
  const location = event.locationName?.split(',')[0]?.trim() || event.venue?.city || 'Wien'

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Zurück zum Event */}
      <Link
        href={localePath(`/event/${eventSlug}`)}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('raffleTerms.backToEvent', { defaultValue: 'Zurück zum Event' })}
      </Link>

      <h1 className="text-3xl font-bold mb-2">
        {t('raffleTerms.title', { defaultValue: 'Gewinnspiel-Teilnahmebedingungen' })}
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        {eventName} — {prize}
      </p>

      <div className="space-y-6 text-foreground">
        <section className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-3">
            1. {t('raffleTerms.organizer', { defaultValue: 'Veranstalter' })}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('raffleTerms.organizerText', {
              defaultValue:
                'Veranstalter des Gewinnspiels ist Share Your Party (nachfolgend „Veranstalter“). Der Gewinn wird von Volxfest bereitgestellt.',
            })}
          </p>
        </section>

        <section className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-3">
            2. {t('raffleTerms.eligibility', { defaultValue: 'Teilnahmeberechtigung' })}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('raffleTerms.eligibilityText', {
              eventName,
              defaultValue:
                'Teilnahmeberechtigt sind natürliche Personen ab 18 Jahren mit Wohnsitz in Österreich. Die Teilnahme setzt eine kostenlose Registrierung auf shareyourparty.de sowie die kostenlose Buchung eines Tickets für das Event „{{eventName}}“ voraus. Pro Person ist nur eine Teilnahme zulässig. Die Teilnahme ist kostenlos — es besteht kein Kaufzwang.',
            })}
          </p>
        </section>

        <section className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-3">
            3. {t('raffleTerms.period', { defaultValue: 'Teilnahmezeitraum' })}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('raffleTerms.periodText', {
              eventName,
              eventDate: eventDateRange,
              location,
              defaultValue:
                'Das Gewinnspiel beginnt mit der Veröffentlichung des Events auf shareyourparty.de und endet mit der Verlosung auf der Veranstaltung „{{eventName}}“ am {{eventDate}}, {{location}}.',
            })}
          </p>
        </section>

        <section className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-3">
            4. {t('raffleTerms.prize', { defaultValue: 'Gewinn' })}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('raffleTerms.prizeText', {
              prize,
              defaultValue:
                'Verlost wird: {{prize}}. Der Gewinn ist nicht übertragbar und kann nicht in bar abgelöst werden. Ein Umtausch ist ausgeschlossen.',
            })}
          </p>
        </section>

        <section className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-3">
            5. {t('raffleTerms.drawing', { defaultValue: 'Ermittlung und Übergabe des Gewinns' })}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {drawDate
              ? t('raffleTerms.drawingText', {
                  drawDate,
                  defaultValue:
                    'Die Ziehung des Gewinners findet ausschließlich vor Ort im Rahmen der Stammersdorfer Weintage am {{drawDate}} statt. Eine Ziehung außerhalb der Veranstaltung ist ausgeschlossen, der Gewinn wird nicht nachträglich übermittelt.',
                })
              : t('raffleTerms.drawingTextNoDate', {
                  defaultValue:
                    'Die Ziehung des Gewinners findet ausschließlich vor Ort im Rahmen der Stammersdorfer Weintage statt. Eine Ziehung außerhalb der Veranstaltung ist ausgeschlossen, der Gewinn wird nicht nachträglich übermittelt.',
                })}
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">
            {t('raffleTerms.drawingPresenceText', {
              defaultValue:
                'Der gezogene Gewinner muss zum Zeitpunkt der Ziehung persönlich anwesend sein und den Gewinn unmittelbar vor Ort entgegennehmen. Ist der gezogene Gewinner nicht anwesend, verfällt der Gewinnanspruch ersatzlos und es wird sofort ein neuer Gewinner gezogen. Dieser Vorgang wiederholt sich so lange, bis ein anwesender Gewinner ermittelt wurde.',
            })}
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">
            {t('raffleTerms.drawingNoNotificationText', {
              defaultValue:
                'Eine Benachrichtigung des Gewinners per E-Mail, Telefon oder über die App erfolgt nicht.',
            })}
          </p>
        </section>

        <section className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-3">
            6. {t('raffleTerms.privacy', { defaultValue: 'Datenschutz' })}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('raffleTerms.privacyText', {
              defaultValue:
                'Die im Rahmen der Teilnahme erhobenen personenbezogenen Daten (Name, E-Mail-Adresse sowie beantwortete Fragen) werden zum Zweck der Durchführung des Gewinnspiels sowie zur Weitergabe an Volxfest verarbeitet. Die Ermittlung und Übergabe des Gewinns erfolgt ausschließlich vor Ort; eine Benachrichtigung des Gewinners per E-Mail findet nicht statt.',
            })}
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">
            <Link href={localePath('/privacy')} className="text-primary underline">
              {t('raffleTerms.privacyLink', {
                defaultValue: 'Datenschutzbestimmungen von Share Your Party',
              })}
            </Link>
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">
            {t('raffleTerms.marketingText', {
              defaultValue:
                'Mit der Teilnahme willigst du ein, dass Volxfest deine E-Mail-Adresse zu Marketingzwecken verwenden darf, insbesondere zur Zusendung von Informationen zu Veranstaltungen, Angeboten und Neuigkeiten.',
            })}
          </p>
        </section>

        <section className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-3">
            7. {t('raffleTerms.liability', { defaultValue: 'Haftung' })}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('raffleTerms.liabilityText', {
              defaultValue:
                'Der Veranstalter haftet nicht für technische Störungen, die eine Teilnahme beeinträchtigen. Für Sach- und Rechtsmängel des Gewinns wird keine Haftung übernommen.',
            })}
          </p>
        </section>

        <section className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-3">
            8. {t('raffleTerms.termination', { defaultValue: 'Vorzeitige Beendigung' })}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('raffleTerms.terminationText', {
              defaultValue:
                'Der Veranstalter behält sich vor, das Gewinnspiel jederzeit aus sachlichen Gründen (z.B. Missbrauch, technische Probleme, Absage der Veranstaltung) abzubrechen oder zu beenden.',
            })}
          </p>
        </section>

        <section className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-3">
            9. {t('raffleTerms.legal', { defaultValue: 'Ausschluss des Rechtswegs' })}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('raffleTerms.legalText', {
              defaultValue: 'Der Rechtsweg ist ausgeschlossen. Es gilt österreichisches Recht.',
            })}
          </p>
        </section>

        <section className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-3">
            10. {t('raffleTerms.facebook', { defaultValue: 'Facebook/Meta-Disclaimer' })}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('raffleTerms.facebookText', {
              defaultValue:
                'Dieses Gewinnspiel steht in keiner Verbindung zu Facebook/Meta und wird in keiner Weise von Facebook/Meta gesponsert, unterstützt oder organisiert. Ansprechpartner und Verantwortlicher ist ausschließlich der oben genannte Veranstalter. Die von den Teilnehmern bereitgestellten Daten werden nicht an Facebook/Meta übermittelt.',
            })}
          </p>
        </section>

        <section className="pt-2">
          <p className="text-sm text-muted-foreground">
            {t('raffleTerms.footer', {
              defaultValue: 'Stand: August 2026 | Veranstalter: Share Your Party',
            })}
          </p>
        </section>
      </div>
    </div>
  )
}
