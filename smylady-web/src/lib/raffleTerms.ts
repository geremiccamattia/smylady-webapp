/**
 * Aufbau der Gewinnspiel-Teilnahmebedingungen.
 *
 * Bewusst als reine Funktion ausserhalb der React-Komponente: Der Text ist
 * rechtlich bindend, und nur so lässt er sich ohne Browser rendern und
 * zeichengenau gegen eine Referenz prüfen (siehe src/__reference__/).
 * Die Komponente macht daraus nur noch Markup.
 */

import { isMultiDayEvent } from '@/lib/utils'

export interface RaffleTermsEvent {
  name: string
  eventDate: string
  eventEndTime?: string | null
  locationName?: string
  venue?: { city?: string } | null
  rafflePrize?: string
  raffleDrawDate?: string | null
  raffleDrawOnSite?: boolean
  rafflePartner?: string
  rafflePartnerMarketing?: boolean
}

/** Absatz einer Sektion. `privacyLink` wird von der Komponente als <Link> gerendert. */
export type RaffleTermsParagraph =
  | { kind: 'text'; text: string }
  | { kind: 'privacyLink'; text: string }

export interface RaffleTermsSection {
  number: number
  heading: string
  paragraphs: RaffleTermsParagraph[]
}

export interface RaffleTermsDocument {
  title: string
  subtitle: string
  sections: RaffleTermsSection[]
  footer: string
}

/** Minimale Signatur von i18next `t` — hält das Modul frei von React-Abhängigkeiten. */
type TFunc = (key: string, options?: Record<string, unknown>) => string

const text = (value: string): RaffleTermsParagraph => ({ kind: 'text', text: value })

export function buildRaffleTerms(
  event: RaffleTermsEvent,
  t: TFunc,
  language: string | undefined,
): RaffleTermsDocument {
  const isEnglish = !!language?.startsWith('en')
  const dateLocale = isEnglish ? 'en-GB' : 'de-AT'

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(dateLocale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  // eventEndTime ist optional und bei den meisten Events gar nicht gesetzt; fehlt
  // es, liefert isMultiDayEvent false. Ein Datumsbereich wird deshalb nur bei
  // echten Mehrtages-Events ausgegeben, sonst stünde dort zweimal dasselbe Datum.
  const eventDateRange = isMultiDayEvent(event.eventDate, event.eventEndTime)
    ? `${formatDate(event.eventDate)} – ${formatDate(event.eventEndTime as string)}`
    : formatDate(event.eventDate)

  // Der Ziehungstermin kommt ausschließlich aus dem Event-Feld raffleDrawDate.
  // Zeitzone fix Europe/Vienna, damit der Termin nicht je nach Gerät wandert.
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

  const partner = event.rafflePartner?.trim() || ''
  const hasPartner = partner.length > 0
  const drawOnSite = event.raffleDrawOnSite === true

  // ── Abschnitt 5 ───────────────────────────────────────────────────────────
  const drawingParagraphs: RaffleTermsParagraph[] = drawOnSite
    ? [
        text(
          drawDate
            ? t('raffleTerms.drawingText', {
                drawDate,
                defaultValue:
                  'Die Ziehung des Gewinners findet ausschließlich vor Ort im Rahmen der Stammersdorfer Weintage am {{drawDate}} statt. Eine Ziehung außerhalb der Veranstaltung ist ausgeschlossen, der Gewinn wird nicht nachträglich übermittelt.',
              })
            : t('raffleTerms.drawingTextNoDate', {
                defaultValue:
                  'Die Ziehung des Gewinners findet ausschließlich vor Ort im Rahmen der Stammersdorfer Weintage statt. Eine Ziehung außerhalb der Veranstaltung ist ausgeschlossen, der Gewinn wird nicht nachträglich übermittelt.',
              }),
        ),
        text(
          t('raffleTerms.drawingPresenceText', {
            defaultValue:
              'Der gezogene Gewinner muss zum Zeitpunkt der Ziehung persönlich anwesend sein und den Gewinn unmittelbar vor Ort entgegennehmen. Ist der gezogene Gewinner nicht anwesend, verfällt der Gewinnanspruch ersatzlos und es wird sofort ein neuer Gewinner gezogen. Dieser Vorgang wiederholt sich so lange, bis ein anwesender Gewinner ermittelt wurde.',
          }),
        ),
        text(
          t('raffleTerms.drawingNoNotificationText', {
            defaultValue:
              'Eine Benachrichtigung des Gewinners per E-Mail, Telefon oder über die App erfolgt nicht.',
          }),
        ),
      ]
    : [
        text(
          t('raffleTerms.drawingRemoteText', {
            defaultValue:
              'Die Ziehung des Gewinners findet nach Ende des Teilnahmezeitraums statt. Eine Anwesenheit vor Ort ist nicht erforderlich.',
          }),
        ),
        text(
          t('raffleTerms.drawingRemoteNotificationText', {
            defaultValue:
              'Der Gewinner wird über die Share Your Party App sowie per E-Mail an die bei der Teilnahme angegebene Adresse benachrichtigt. Meldet sich der Gewinner nicht innerhalb von 14 Tagen nach der Benachrichtigung, verfällt der Gewinnanspruch ersatzlos und es wird ein neuer Gewinner gezogen.',
          }),
        ),
        text(
          t('raffleTerms.drawingRemoteHandoverText', {
            defaultValue:
              'Die Übergabe des Gewinns wird individuell mit dem Gewinner vereinbart. Eine Barablöse oder ein Umtausch des Gewinns ist ausgeschlossen.',
          }),
        ),
      ]

  // ── Abschnitt 6 ───────────────────────────────────────────────────────────
  // Ohne Partner wird ausdrücklich zugesichert, dass nichts weitergegeben wird.
  // Der Link auf die Datenschutzbestimmungen steht in jedem Fall als eigener Absatz.
  const privacyParagraphs: RaffleTermsParagraph[] = [
    text(
      hasPartner
        ? t('raffleTerms.privacyText', {
            partner,
            defaultValue:
              'Die im Rahmen der Teilnahme erhobenen personenbezogenen Daten (Name, E-Mail-Adresse sowie beantwortete Fragen) werden zum Zweck der Durchführung des Gewinnspiels sowie zur Weitergabe an {{partner}} verarbeitet. Die Ermittlung und Übergabe des Gewinns erfolgt ausschließlich vor Ort; eine Benachrichtigung des Gewinners per E-Mail findet nicht statt.',
          })
        : t('raffleTerms.privacyTextNoPartner', {
            defaultValue:
              'Die im Rahmen der Teilnahme erhobenen personenbezogenen Daten (Name, E-Mail-Adresse sowie beantwortete Fragen) werden ausschließlich zum Zweck der Durchführung des Gewinnspiels verarbeitet und nicht an Dritte weitergegeben.',
          }),
    ),
    {
      kind: 'privacyLink',
      text: t('raffleTerms.privacyLink', {
        defaultValue: 'Datenschutzbestimmungen von Share Your Party',
      }),
    },
  ]

  if (hasPartner && event.rafflePartnerMarketing === true) {
    privacyParagraphs.push(
      text(
        t('raffleTerms.marketingText', {
          partner,
          defaultValue:
            'Mit der Teilnahme willigst du ein, dass {{partner}} deine E-Mail-Adresse zu Marketingzwecken verwenden darf, insbesondere zur Zusendung von Informationen zu Veranstaltungen, Angeboten und Neuigkeiten.',
        }),
      ),
    )
  }

  return {
    title: t('raffleTerms.title', { defaultValue: 'Gewinnspiel-Teilnahmebedingungen' }),
    subtitle: `${eventName} — ${prize}`,
    footer: t('raffleTerms.footer', {
      defaultValue: 'Stand: August 2026 | Veranstalter: Share Your Party',
    }),
    sections: [
      {
        number: 1,
        heading: t('raffleTerms.organizer', { defaultValue: 'Veranstalter' }),
        paragraphs: [
          text(
            // Ohne Partner entfällt der Satz zum bereitgestellten Gewinn ersatzlos —
            // dann stellt ihn der Veranstalter selbst.
            hasPartner
              ? t('raffleTerms.organizerText', {
                  partner,
                  defaultValue:
                    'Veranstalter des Gewinnspiels ist Share Your Party (nachfolgend „Veranstalter“). Der Gewinn wird von {{partner}} bereitgestellt.',
                })
              : t('raffleTerms.organizerTextNoPartner', {
                  defaultValue:
                    'Veranstalter des Gewinnspiels ist Share Your Party (nachfolgend „Veranstalter“).',
                }),
          ),
        ],
      },
      {
        number: 2,
        heading: t('raffleTerms.eligibility', { defaultValue: 'Teilnahmeberechtigung' }),
        paragraphs: [
          text(
            t('raffleTerms.eligibilityText', {
              eventName,
              defaultValue:
                'Teilnahmeberechtigt sind natürliche Personen ab 18 Jahren mit Wohnsitz in Österreich. Die Teilnahme setzt eine kostenlose Registrierung auf shareyourparty.de sowie die kostenlose Buchung eines Tickets für das Event „{{eventName}}“ voraus. Pro Person ist nur eine Teilnahme zulässig. Die Teilnahme ist kostenlos — es besteht kein Kaufzwang.',
            }),
          ),
        ],
      },
      {
        number: 3,
        heading: t('raffleTerms.period', { defaultValue: 'Teilnahmezeitraum' }),
        paragraphs: [
          text(
            t('raffleTerms.periodText', {
              eventName,
              eventDate: eventDateRange,
              location,
              defaultValue:
                'Das Gewinnspiel beginnt mit der Veröffentlichung des Events auf shareyourparty.de und endet mit der Verlosung auf der Veranstaltung „{{eventName}}“ am {{eventDate}}, {{location}}.',
            }),
          ),
        ],
      },
      {
        number: 4,
        heading: t('raffleTerms.prize', { defaultValue: 'Gewinn' }),
        paragraphs: [
          text(
            t('raffleTerms.prizeText', {
              prize,
              defaultValue:
                'Verlost wird: {{prize}}. Der Gewinn ist nicht übertragbar und kann nicht in bar abgelöst werden. Ein Umtausch ist ausgeschlossen.',
            }),
          ),
        ],
      },
      {
        number: 5,
        heading: t('raffleTerms.drawing', { defaultValue: 'Ermittlung und Übergabe des Gewinns' }),
        paragraphs: drawingParagraphs,
      },
      {
        number: 6,
        heading: t('raffleTerms.privacy', { defaultValue: 'Datenschutz' }),
        paragraphs: privacyParagraphs,
      },
      {
        number: 7,
        heading: t('raffleTerms.liability', { defaultValue: 'Haftung' }),
        paragraphs: [
          text(
            t('raffleTerms.liabilityText', {
              defaultValue:
                'Der Veranstalter haftet nicht für technische Störungen, die eine Teilnahme beeinträchtigen. Für Sach- und Rechtsmängel des Gewinns wird keine Haftung übernommen.',
            }),
          ),
        ],
      },
      {
        number: 8,
        heading: t('raffleTerms.termination', { defaultValue: 'Vorzeitige Beendigung' }),
        paragraphs: [
          text(
            t('raffleTerms.terminationText', {
              defaultValue:
                'Der Veranstalter behält sich vor, das Gewinnspiel jederzeit aus sachlichen Gründen (z.B. Missbrauch, technische Probleme, Absage der Veranstaltung) abzubrechen oder zu beenden.',
            }),
          ),
        ],
      },
      {
        number: 9,
        heading: t('raffleTerms.legal', { defaultValue: 'Ausschluss des Rechtswegs' }),
        paragraphs: [
          text(
            t('raffleTerms.legalText', {
              defaultValue: 'Der Rechtsweg ist ausgeschlossen. Es gilt österreichisches Recht.',
            }),
          ),
        ],
      },
      {
        number: 10,
        heading: t('raffleTerms.facebook', { defaultValue: 'Facebook/Meta-Disclaimer' }),
        paragraphs: [
          text(
            t('raffleTerms.facebookText', {
              defaultValue:
                'Dieses Gewinnspiel steht in keiner Verbindung zu Facebook/Meta und wird in keiner Weise von Facebook/Meta gesponsert, unterstützt oder organisiert. Ansprechpartner und Verantwortlicher ist ausschließlich der oben genannte Veranstalter. Die von den Teilnehmern bereitgestellten Daten werden nicht an Facebook/Meta übermittelt.',
            }),
          ),
        ],
      },
    ],
  }
}
