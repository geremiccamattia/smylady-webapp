import {
  OPERATOR,
  operatorAddressLine,
  operatorDisplayName,
  operatorOwnersLine,
  operatorOwnersLineEn,
} from './operator'
import type { LegalBlock, LegalDocument, LegalLanguage } from './types'

export const IMPRINT_VERSION = '2026-11-05'

function optionalRows(language: LegalLanguage): Array<[string, string]> {
  const rows: Array<[string, string]> = []
  const de = language === 'de'
  if (OPERATOR.legalForm) rows.push([de ? 'Rechtsform' : 'Legal form', OPERATOR.legalForm])
  if (OPERATOR.companyRegister) rows.push([de ? 'Firmenbuch' : 'Company register', OPERATOR.companyRegister])
  if (OPERATOR.vatId) rows.push([de ? 'UID-Nummer' : 'VAT ID', OPERATOR.vatId])
  if (OPERATOR.gisaNumber) rows.push([de ? 'GISA-Zahl' : 'GISA number', OPERATOR.gisaNumber])
  if (OPERATOR.tradeDescription) rows.push([de ? 'Gewerbe' : 'Trade licence', OPERATOR.tradeDescription])
  if (OPERATOR.phone) rows.push([de ? 'Telefon' : 'Phone', OPERATOR.phone])
  return rows
}

function buildDe(): LegalDocument {
  const contactRows: Array<[string, string]> = [
    ['Diensteanbieter', operatorDisplayName()],
    ['Inhaber', operatorOwnersLine()],
    ['Anschrift', operatorAddressLine('de')],
    ['E-Mail', `[${OPERATOR.email}](mailto:${OPERATOR.email})`],
    ...optionalRows('de'),
    ['Gewerbebehörde', OPERATOR.tradeAuthority.de],
    ['Kammerzugehörigkeit', OPERATOR.chamber.de],
    ['Anwendbare Rechtsvorschriften', 'Gewerbeordnung 1994, E-Commerce-Gesetz, abrufbar unter [www.ris.bka.gv.at](https://www.ris.bka.gv.at)'],
  ]

  const blocks: LegalBlock[] = []

  return {
    kind: 'imprint',
    language: 'de',
    title: 'Impressum',
    shortTitle: 'Impressum',
    version: IMPRINT_VERSION,
    effectiveDate: IMPRINT_VERSION,
    intro: blocks,
    sections: [
      {
        id: 'provider',
        title: 'Angaben gemäß § 5 ECG und § 25 Mediengesetz',
        blocks: [
          { type: 'table', head: ['Angabe', 'Wert'], rows: contactRows },
          {
            type: 'p',
            text: 'Unternehmensgegenstand: Betrieb der Online-Plattform „Share Your Party" (Website und Apps) zur Veröffentlichung von Veranstaltungen, zur Vermittlung von Tickets zwischen Veranstaltern und Gästen sowie zur Vermittlung und Abwicklung von Kooperationen zwischen Unternehmen (Brands) und Creatorn.',
          },
          {
            type: 'p',
            text: 'Grundlegende Richtung (Blattlinie) gemäß § 25 Abs. 4 MedienG: Information über Veranstaltungen, Nachtleben und Freizeit sowie über die Angebote von Share Your Party.',
          },
        ],
      },
      {
        id: 'responsible',
        title: 'Verantwortlich für den Inhalt',
        blocks: [
          { type: 'p', text: `${operatorOwnersLine()}, ${operatorAddressLine('de')}.` },
          {
            type: 'p',
            text: 'Inhalte, die Nutzerinnen und Nutzer selbst veröffentlichen (Events, Beiträge, Kommentare, Fotos, Nachrichten), stammen von der jeweiligen Person. Share Your Party ist dafür Hosting-Dienst im Sinne des Digital Services Act (Verordnung (EU) 2022/2065) und entfernt rechtswidrige Inhalte nach Kenntnis unverzüglich.',
          },
        ],
      },
      {
        id: 'contact',
        title: 'Kontakt, Meldungen und Kontaktstelle nach Art. 11 und 12 DSA',
        blocks: [
          {
            type: 'p',
            text: `Für Anfragen, Beschwerden, Hinweise auf rechtswidrige Inhalte (Art. 16 DSA) und für Behörden ist die zentrale Kontaktstelle: [${OPERATOR.email}](mailto:${OPERATOR.email}). Kommunikation ist auf Deutsch und Englisch möglich. Inhalte können außerdem direkt in der App und auf der Website über die Funktion „Melden" gemeldet werden.`,
          },
          {
            type: 'p',
            text: 'Anfragen zum Datenschutz (Auskunft, Löschung, Widerspruch) richten Sie bitte ebenfalls an diese Adresse, Betreff „Datenschutz". Einzelheiten finden Sie in der [Datenschutzerklärung](/privacy).',
          },
        ],
      },
      {
        id: 'dispute',
        title: 'Verbraucherstreitbeilegung',
        blocks: [
          {
            type: 'p',
            text: `Wir sind nicht verpflichtet und grundsätzlich nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. Verbraucherinnen und Verbraucher können sich bei Problemen mit Online-Geschäften an die ${OPERATOR.consumerArbitration.name} wenden: [${OPERATOR.consumerArbitration.website.replace('https://', '')}](${OPERATOR.consumerArbitration.website}). Die frühere Online-Streitbeilegungsplattform der Europäischen Kommission wurde mit 20. Juli 2025 eingestellt.`,
          },
          {
            type: 'p',
            text: 'Wir bemühen uns, Meinungsverschiedenheiten direkt zu klären. Bitte wenden Sie sich zuerst an die oben genannte E-Mail-Adresse.',
          },
        ],
      },
      {
        id: 'liability',
        title: 'Haftung für Inhalte und Links',
        blocks: [
          {
            type: 'p',
            text: 'Für eigene Inhalte sind wir nach den allgemeinen Gesetzen verantwortlich. Für fremde Informationen, die Nutzerinnen und Nutzer einstellen, gelten §§ 13 bis 18 ECG und die Art. 4 bis 8 DSA: Wir sind nicht verpflichtet, diese Inhalte allgemein zu überwachen, entfernen rechtswidrige Inhalte aber unverzüglich, sobald wir davon Kenntnis erlangen.',
          },
          {
            type: 'p',
            text: 'Unsere Angebote enthalten Links zu externen Websites, auf deren Inhalte wir keinen Einfluss haben. Für diese Inhalte ist stets der jeweilige Anbieter verantwortlich. Zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar; bei Bekanntwerden entfernen wir solche Links umgehend.',
          },
        ],
      },
      {
        id: 'copyright',
        title: 'Urheberrecht',
        blocks: [
          {
            type: 'p',
            text: 'Die von uns erstellten Inhalte und Werke unterliegen dem österreichischen Urheberrecht. Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen unserer schriftlichen Zustimmung. Inhalte Dritter sind als solche gekennzeichnet; von Nutzerinnen und Nutzern hochgeladene Inhalte bleiben deren geistiges Eigentum (siehe [AGB](/terms)). Sollten Sie eine Urheberrechtsverletzung bemerken, bitten wir um einen Hinweis.',
          },
        ],
      },
      {
        id: 'images',
        title: 'Bildnachweise',
        blocks: [
          {
            type: 'p',
            text: 'Eigene Aufnahmen, Fotos von Veranstaltern und Nutzerinnen und Nutzern (mit deren Zustimmung) sowie lizenzfreie Bilder von Pexels.',
          },
        ],
      },
    ],
    footer: 'Stand: 5. November 2026',
  }
}

function buildEn(): LegalDocument {
  const contactRows: Array<[string, string]> = [
    ['Service provider', operatorDisplayName()],
    ['Owners', operatorOwnersLineEn()],
    ['Address', operatorAddressLine('en')],
    ['Email', `[${OPERATOR.email}](mailto:${OPERATOR.email})`],
    ...optionalRows('en'),
    ['Trade authority', OPERATOR.tradeAuthority.en],
    ['Chamber membership', OPERATOR.chamber.en],
    ['Applicable regulations', 'Austrian Trade Act (Gewerbeordnung 1994), E-Commerce Act (ECG), available at [www.ris.bka.gv.at](https://www.ris.bka.gv.at)'],
  ]

  return {
    kind: 'imprint',
    language: 'en',
    title: 'Legal Notice (Impressum)',
    shortTitle: 'Legal Notice',
    version: IMPRINT_VERSION,
    effectiveDate: IMPRINT_VERSION,
    intro: [
      {
        type: 'p',
        text: 'This is a convenience translation. The German version is legally binding.',
      },
    ],
    sections: [
      {
        id: 'provider',
        title: 'Information pursuant to § 5 ECG and § 25 Austrian Media Act',
        blocks: [
          { type: 'table', head: ['Item', 'Value'], rows: contactRows },
          {
            type: 'p',
            text: 'Business purpose: Operation of the online platform "Share Your Party" (website and apps) for publishing events, brokering tickets between organisers and guests, and brokering and processing collaborations between companies (brands) and creators.',
          },
          {
            type: 'p',
            text: 'Editorial line pursuant to § 25 (4) Media Act: Information about events, nightlife and leisure, and about the services of Share Your Party.',
          },
        ],
      },
      {
        id: 'responsible',
        title: 'Responsible for content',
        blocks: [
          { type: 'p', text: `${operatorOwnersLineEn()}, ${operatorAddressLine('en')}.` },
          {
            type: 'p',
            text: 'Content published by users themselves (events, posts, comments, photos, messages) originates from the respective person. Share Your Party acts as a hosting service within the meaning of the Digital Services Act (Regulation (EU) 2022/2065) and removes illegal content without undue delay once it becomes aware of it.',
          },
        ],
      },
      {
        id: 'contact',
        title: 'Contact, notices and point of contact under Art. 11 and 12 DSA',
        blocks: [
          {
            type: 'p',
            text: `For enquiries, complaints, notices of illegal content (Art. 16 DSA) and for authorities, the single point of contact is [${OPERATOR.email}](mailto:${OPERATOR.email}). Communication is possible in German and English. Content can also be reported directly in the app and on the website using the "Report" function.`,
          },
          {
            type: 'p',
            text: 'Please also send data protection requests (access, erasure, objection) to this address with the subject "Data protection". Details are set out in the [Privacy Policy](/en/privacy).',
          },
        ],
      },
      {
        id: 'dispute',
        title: 'Consumer dispute resolution',
        blocks: [
          {
            type: 'p',
            text: `We are neither obliged nor generally willing to participate in dispute resolution proceedings before a consumer arbitration board. Consumers may contact the ${OPERATOR.consumerArbitration.name} for problems with online transactions: [${OPERATOR.consumerArbitration.website.replace('https://', '')}](${OPERATOR.consumerArbitration.website}). The former Online Dispute Resolution platform of the European Commission was discontinued on 20 July 2025.`,
          },
          {
            type: 'p',
            text: 'We endeavour to resolve disagreements directly. Please contact the email address above first.',
          },
        ],
      },
      {
        id: 'liability',
        title: 'Liability for content and links',
        blocks: [
          {
            type: 'p',
            text: 'We are responsible for our own content in accordance with general law. For third-party information posted by users, §§ 13 to 18 ECG and Art. 4 to 8 DSA apply: we are not obliged to monitor such content generally, but we remove illegal content without undue delay once we become aware of it.',
          },
          {
            type: 'p',
            text: 'Our services contain links to external websites over whose content we have no influence. The respective provider is always responsible for such content. No legal violations were apparent at the time of linking; we remove such links promptly upon becoming aware of violations.',
          },
        ],
      },
      {
        id: 'copyright',
        title: 'Copyright',
        blocks: [
          {
            type: 'p',
            text: 'Content and works created by us are subject to Austrian copyright law. Reproduction, editing, distribution and any kind of use beyond the limits of copyright law require our written consent. Third-party content is marked as such; content uploaded by users remains their intellectual property (see [Terms](/en/terms)). Should you notice a copyright infringement, please let us know.',
          },
        ],
      },
      {
        id: 'images',
        title: 'Image credits',
        blocks: [
          {
            type: 'p',
            text: 'Own photographs, photos from organisers and users (with their consent), and royalty-free images from Pexels.',
          },
        ],
      },
    ],
    footer: 'Last updated: 5 November 2026',
  }
}

export function getImprint(language: LegalLanguage): LegalDocument {
  return language === 'en' ? buildEn() : buildDe()
}
