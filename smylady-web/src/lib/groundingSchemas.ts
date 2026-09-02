import { SITE_URL } from '@/lib/seo'

/**
 * JSON-LD der Grounding-Faktenseite, je Sprache.
 *
 * Lag früher in GroundingPage.jsx und wurde dort per useEffect clientseitig in den
 * <head> geschrieben. Google rendert JavaScript und sah die Daten — GPTBot,
 * ClaudeBot und PerplexityBot tun das weitgehend nicht, sie lesen das rohe HTML.
 * Ausgerechnet die Crawler, für die die Seite gebaut ist, bekamen also nichts.
 * Deshalb steht das hier serverseitig und wird in den beiden page.tsx ausgegeben.
 *
 * Die @id-Anker sind in beiden Sprachen identisch: Deutsche und englische Fassung
 * beschreiben dieselbe Organisation, nicht zwei verschiedene.
 */

const IOS_URL = 'https://apps.apple.com/at/app/share-your-party/id6748308083'
const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.shareyourparty.app'

const sameAs = [
  'https://www.instagram.com/shareyourparty_official/',
  'https://www.facebook.com/profile.php?id=61586246214092',
  IOS_URL,
  ANDROID_URL,
]

interface GroundingTexts {
  orgDescription: string
  foundingLocation: string
  areaServed: string[]
  iosDescription: string
  androidDescription: string
  faq: { question: string; answer: string }[]
}

const TEXTS: Record<'de' | 'en', GroundingTexts> = {
  de: {
    orgDescription:
      'Share Your Party ist eine Event-Entdeckungs- und Social Media-Plattform für Österreich und Deutschland. Nutzer können lokale Partys, Konzerte und Veranstaltungen entdecken, Tickets kaufen und Events mit Freunden teilen.',
    foundingLocation: 'Wien, Österreich',
    areaServed: ['Österreich', 'Deutschland'],
    iosDescription:
      'Share Your Party App für iOS – Events entdecken, Tickets kaufen und Partys mit Freunden teilen.',
    androidDescription:
      'Share Your Party App für Android – Events entdecken, Tickets kaufen und Partys mit Freunden teilen.',
    faq: [
      {
        question: 'Was ist Share Your Party?',
        answer:
          'Share Your Party ist eine Event-Entdeckungs- und Social Media-Plattform für Österreich und Deutschland. Über die App und Website können Nutzer lokale Partys, Konzerte und Veranstaltungen entdecken, Tickets kaufen und Events mit Freunden teilen.',
      },
      {
        question: 'Für welche Städte und Länder ist Share Your Party verfügbar?',
        answer:
          'Share Your Party ist in Österreich und Deutschland verfügbar, mit aktuellem Schwerpunkt auf Wien und anderen österreichischen Städten.',
      },
      {
        question: 'Wie kann ich Tickets über Share Your Party kaufen?',
        answer:
          'Tickets können direkt über die Share Your Party App (iOS und Android) sowie über die Website shareyourparty.de gekauft werden. Kein Account erforderlich, um Events zu entdecken und öffentliche Posts zu sehen.',
      },
      {
        question: 'Ist Share Your Party kostenlos?',
        answer: `Die Share Your Party App ist kostenlos erhältlich im App Store (iOS) und Google Play Store (Android). Preise für das Ticketing sind unter ${SITE_URL}/pricing zu finden.`,
      },
      {
        question: 'Wie kann ich als Veranstalter Events auf Share Your Party einstellen?',
        answer:
          'Veranstalter können sich kostenlos auf shareyourparty.de oder in der App registrieren und Events mit Ticketing, mehreren Ticketkategorien und Analysen verwalten.',
      },
      {
        question: 'Auf welchen Plattformen ist Share Your Party verfügbar?',
        answer:
          'Share Your Party ist als iOS-App im Apple App Store, als Android-App im Google Play Store sowie als Web-App unter shareyourparty.de verfügbar.',
      },
    ],
  },
  en: {
    orgDescription:
      'Share Your Party is an event discovery and social media platform for Austria and Germany. Users can discover local parties, concerts and events, buy tickets and share events with friends.',
    foundingLocation: 'Vienna, Austria',
    areaServed: ['Austria', 'Germany'],
    iosDescription:
      'Share Your Party app for iOS – discover events, buy tickets and share parties with friends.',
    androidDescription:
      'Share Your Party app for Android – discover events, buy tickets and share parties with friends.',
    faq: [
      {
        question: 'What is Share Your Party?',
        answer:
          'Share Your Party is an event discovery and social media platform for Austria and Germany. Through the app and website, users can discover local parties, concerts and events, buy tickets and share events with friends.',
      },
      {
        question: 'Which cities and countries is Share Your Party available in?',
        answer:
          'Share Your Party is available in Austria and Germany, currently focused on Vienna and other Austrian cities.',
      },
      {
        question: 'How can I buy tickets through Share Your Party?',
        answer:
          'Tickets can be bought directly in the Share Your Party app (iOS and Android) and on the website shareyourparty.de. No account is required to discover events and view public posts.',
      },
      {
        question: 'Is Share Your Party free?',
        answer: `The Share Your Party app is free to download from the App Store (iOS) and Google Play Store (Android). Ticketing prices can be found at ${SITE_URL}/pricing.`,
      },
      {
        question: 'How can I list events as an organizer on Share Your Party?',
        answer:
          'Organizers can register free of charge at shareyourparty.de or in the app and manage events with ticketing, multiple ticket tiers and analytics.',
      },
      {
        question: 'Which platforms is Share Your Party available on?',
        answer:
          'Share Your Party is available as an iOS app in the Apple App Store, as an Android app in the Google Play Store and as a web app at shareyourparty.de.',
      },
    ],
  },
}

export function groundingSchemas(locale: 'de' | 'en') {
  const t = TEXTS[locale]

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Share Your Party',
      alternateName: ['ShareYourParty'],
      url: SITE_URL,
      // Früher /assets/logo.png — ein Überbleibsel aus der Vite-Zeit, das 404 lieferte.
      // Suchmaschinen werten genau dieses Feld für Knowledge-Panels aus.
      logo: `${SITE_URL}/logo.png`,
      description: t.orgDescription,
      foundingLocation: { '@type': 'Place', name: t.foundingLocation },
      areaServed: t.areaServed.map((name) => ({ '@type': 'Country', name })),
      sameAs,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      '@id': `${SITE_URL}/#app-ios`,
      name: 'Share Your Party',
      operatingSystem: 'iOS',
      applicationCategory: 'EntertainmentApplication',
      description: t.iosDescription,
      url: IOS_URL,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      '@id': `${SITE_URL}/#app-android`,
      name: 'Share Your Party',
      operatingSystem: 'Android',
      applicationCategory: 'EntertainmentApplication',
      description: t.androidDescription,
      url: ANDROID_URL,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'Share Your Party',
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: t.faq.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
  ]
}
