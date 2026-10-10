/**
 * Inhalte der Seite /events/halloween-wien.
 *
 * Alles Redaktionelle liegt hier, damit es sich aktualisieren lässt, ohne die
 * View anzufassen: Tabelle, Abschnittstexte, Tipps und FAQ. Die View rendert
 * nur, die Schema-Datei (halloweenWienSchema.ts) liest dieselben Konstanten —
 * doppelte Pflege wäre eine sichere Quelle für Abweichungen zwischen sichtbarem
 * Text und Auszeichnung.
 *
 * Quelle des Inhalts: halloween-wien-2026.md, inhaltlich unverändert übernommen.
 */

export type PageLocale = 'de' | 'en'

type Localized<T> = Record<PageLocale, T>

// ──────────────────────────────────────────────────────────────
// Seitenkopf
// ──────────────────────────────────────────────────────────────

export const PAGE_PATH = '/events/halloween-wien'

export const SEO: Localized<{ title: string; description: string }> = {
  de: {
    title: 'Halloween in Wien 2026: Die besten Partys & Events',
    description:
      'Halloween 2026 fällt auf einen Samstag: die besten Halloween-Partys in Wien – vom Warehouse Rave bis zur Gothic-Nacht, mit Beginnzeiten, Preisen & Altersgrenzen.',
  },
  en: {
    title: 'Halloween in Vienna 2026: The Best Parties & Events',
    description:
      'Halloween 2026 falls on a Saturday: the best Halloween parties in Vienna – from warehouse rave to gothic night, with start times, prices and age limits.',
  },
}

export const HEADLINE: Localized<string> = {
  de: 'Halloween in Wien 2026: Die besten Partys am 31. Oktober',
  en: 'Halloween in Vienna 2026: The Best Parties on 31 October',
}

export const INTRO: Localized<string[]> = {
  de: [
    'Halloween fällt 2026 auf einen **Samstag** – besser kann es kaum liegen. Die Clubs nutzen das voll aus: Vom Warehouse Rave in der Ottakringer Brauerei über drei Floors mitten in der Innenstadt bis zur Drum-&-Bass-Nacht im Flex und der Gothic-Party im Viper Room ist für jeden Geschmack etwas dabei. Und weil am Sonntag Allerheiligen ist, musst du dir um den nächsten Morgen keine Gedanken machen.',
    'Wir haben die Halloween-Events in Wien nach Musikrichtung sortiert, damit du schnell die Party findest, die zu dir passt. Deine Tickets bekommst du direkt über Share Your Party.',
  ],
  en: [
    'Halloween 2026 falls on a **Saturday** – it could hardly land better. The clubs are making the most of it: from the warehouse rave at the Ottakringer Brauerei and three floors right in the city centre to the drum & bass night at Flex and the gothic party at the Viper Room, there is something for every taste. And because Sunday is All Saints’ Day, you do not have to worry about the next morning.',
    'We have sorted Vienna’s Halloween events by music style so you can quickly find the party that suits you. You can get your tickets directly through Share Your Party.',
  ],
}

export const UPDATED_NOTE: Localized<string> = {
  de: 'Stand: 22. September 2026. Weitere Events kommen laufend dazu – wir aktualisieren diese Liste.',
  en: 'Last updated: 22 September 2026. More events are added continuously – we keep this list up to date.',
}

// ──────────────────────────────────────────────────────────────
// Übersichtstabelle
// ──────────────────────────────────────────────────────────────

export interface HalloweenEventRow {
  /** Eigenname, in beiden Sprachen gleich. */
  name: string
  location: string
  start: Localized<string>
  music: Localized<string>
  price: Localized<string>
  /**
   * Interner Pfad zur Eventseite — RELATIV, ohne Sprachpräfix. Aktuell hat jede
   * Zeile einen: Die Tabelle listet nur Events, die auch in der App liegen.
   * Optional bleibt das Feld, damit sich später eine Zeile ohne eigene
   * Eventseite ergänzen lässt, ohne die View anzufassen.
   */
  eventUrl?: string
}

export const TABLE_HEADERS: Localized<string[]> = {
  de: ['Event', 'Location', 'Beginn', 'Musik', 'Tickets ab'],
  en: ['Event', 'Location', 'Start', 'Music', 'Tickets from'],
}

/**
 * Nur Events, die auch in der App liegen — jede Zeile ist verlinkt.
 * Die Reihenfolge bestimmt zugleich die Reihenfolge der ItemList.
 */
export const EVENT_ROWS: HalloweenEventRow[] = [
  {
    name: 'Halloween Warehouse Rave',
    location: 'Ottakringer Brauerei, 1160',
    start: { de: '21:00', en: '21:00' },
    music: { de: 'Warehouse Rave', en: 'Warehouse rave' },
    price: { de: '40 €', en: '€40' },
    eventUrl: '/event/halloween-warehouse-rave-3df1282d',
  },
  {
    name: 'HALLOWEEN TRANSMISSION',
    location: 'O – Der Klub, 1010',
    start: { de: '22:00', en: '22:00' },
    music: { de: 'House, Techno, Hip Hop', en: 'House, techno, hip hop' },
    price: { de: '17–79 €', en: '€17–79' },
    eventUrl: '/event/halloween-transmission-3df12b2b',
  },
  {
    name: 'FACE OFF: Halloween Special',
    location: 'Flex, 1010',
    start: { de: '23:00', en: '23:00' },
    music: { de: 'Drum & Bass', en: 'Drum & bass' },
    price: { de: '15 €', en: '€15' },
    eventUrl: '/event/face-off-halloween-special-3df12b33',
  },
  {
    name: 'EVIL DISCO – Halloween Special',
    location: 'Viper Room, 1030',
    start: { de: '22:00', en: '22:00' },
    music: { de: 'Gothic, Metal, Electro', en: 'Gothic, metal, electro' },
    price: { de: '8 €', en: '€8' },
    eventUrl: '/event/evil-disco-halloween-special-3df12827',
  },
  {
    name: 'Persil Vienna Halloween Run',
    location: 'Prater, 1020',
    start: { de: 'Fr, 30.10.', en: 'Fri, 30 Oct' },
    music: { de: 'Lauf-Event', en: 'Running event' },
    price: { de: '18–35 €', en: '€18–35' },
    eventUrl: '/event/persil-vienna-halloween-run-2026-3df12b2f',
  },
]

export const TABLE_HEADING: Localized<string> = {
  de: 'Alle Halloween-Partys in Wien auf einen Blick',
  en: 'All Halloween parties in Vienna at a glance',
}

export const TABLE_NOTE: Localized<string> = {
  de: 'Alle Preise sind Vorverkaufspreise, sofern nicht anders angegeben.',
  en: 'All prices are advance-sale prices unless stated otherwise.',
}

/** Die eigenen Events in Tabellenreihenfolge — Grundlage der ItemList. */
export const OWN_EVENTS = EVENT_ROWS.filter(row => row.eventUrl)

// ──────────────────────────────────────────────────────────────
// Abschnitte nach Musikrichtung
// ──────────────────────────────────────────────────────────────

export interface HalloweenEntry {
  id: string
  heading: Localized<string>
  paragraphs: Localized<string[]>
  /** Relativer Pfad, nur bei eigenen Events. */
  eventUrl?: string
  linkLabel?: Localized<string>
}

export interface HalloweenSection {
  id: string
  heading: Localized<string>
  entries: HalloweenEntry[]
}

export const SECTIONS: HalloweenSection[] = [
  {
    id: 'techno-house-rave',
    heading: { de: 'Techno, House & Rave', en: 'Techno, house & rave' },
    entries: [
      {
        id: 'warehouse-rave',
        heading: {
          de: 'Halloween Warehouse Rave – Ottakringer Brauerei',
          en: 'Halloween Warehouse Rave – Ottakringer Brauerei',
        },
        paragraphs: {
          de: [
            'Die Ottakringer Brauerei wird zur Warehouse-Location: Von 21:00 bis 05:00 Uhr wird hier durchgeravt. Das Motto: Zeig dein anderes Ich, das erst nach Einbruch der Dunkelheit zum Vorschein kommt. Tickets gibt es im Vorverkauf ab 40 €, Einlass ab 18 Jahren.',
            '**Wichtig:** Es gilt One-Way-Entry. Wer die Location verlässt, kommt nicht mehr hinein.',
          ],
          en: [
            'The Ottakringer Brauerei turns into a warehouse venue: from 21:00 until 05:00 the rave runs through the night. The motto: show the other self that only comes out after dark. Advance tickets start at €40, admission from 18.',
            '**Important:** one-way entry applies. Anyone who leaves the venue cannot get back in.',
          ],
        },
        eventUrl: '/event/halloween-warehouse-rave-3df1282d',
        linkLabel: {
          de: 'Tickets für den Halloween Warehouse Rave',
          en: 'Tickets for the Halloween Warehouse Rave',
        },
      },
      {
        id: 'halloween-transmission',
        heading: {
          de: 'HALLOWEEN TRANSMISSION – O – Der Klub',
          en: 'HALLOWEEN TRANSMISSION – O – Der Klub',
        },
        paragraphs: {
          de: [
            'Mitten in der Innenstadt bespielt das O – Der Klub an der Oper drei Floors: Im **CORE** legt Super Disco Club Charts und Classics auf, im **ORBIT** gibt es mit SIGNAL Melodic House & Techno, und im **KONSULAT** laufen Hip Hop und Urban Beats. Beginn ist um 22:00 Uhr, Tickets ab 17 € – je nach Kategorie bis 79 €. Einlass ab 19 Jahren.',
          ],
          en: [
            'Right in the city centre, O – Der Klub near the opera runs three floors: **CORE** has Super Disco Club with charts and classics, **ORBIT** brings melodic house & techno with SIGNAL, and **KONSULAT** plays hip hop and urban beats. Doors at 22:00, tickets from €17 – up to €79 depending on the category. Admission from 19.',
          ],
        },
        eventUrl: '/event/halloween-transmission-3df12b2b',
        linkLabel: {
          de: 'Tickets für HALLOWEEN TRANSMISSION',
          en: 'Tickets for HALLOWEEN TRANSMISSION',
        },
      },
    ],
  },
  {
    id: 'drum-and-bass',
    heading: { de: 'Drum & Bass', en: 'Drum & bass' },
    entries: [
      {
        id: 'face-off',
        heading: {
          de: 'FACE OFF: Halloween Special – Flex',
          en: 'FACE OFF: Halloween Special – Flex',
        },
        paragraphs: {
          de: [
            'FACE OFF, nach eigenen Angaben Österreichs größtes Face-to-Face-Drum-&-Bass-Event, feiert Halloween im Flex am Donaukanal. Sechs Paarungen spielen gegeneinander, darunter Magnetude F2F Prdk und Ced F2F Dnbreak. Los geht’s um 23:00 Uhr, Tickets ab 15 €.',
          ],
          en: [
            'FACE OFF, by its own account Austria’s largest face-to-face drum & bass event, celebrates Halloween at Flex on the Donaukanal. Six pairings go head to head, among them Magnetude F2F Prdk and Ced F2F Dnbreak. It starts at 23:00, tickets from €15.',
          ],
        },
        eventUrl: '/event/face-off-halloween-special-3df12b33',
        linkLabel: {
          de: 'Tickets für FACE OFF: Halloween Special',
          en: 'Tickets for FACE OFF: Halloween Special',
        },
      },
    ],
  },
  {
    id: 'rock-metal-gothic',
    heading: { de: 'Rock, Metal & Gothic', en: 'Rock, metal & gothic' },
    entries: [
      {
        id: 'evil-disco',
        heading: {
          de: 'EVIL DISCO – Halloween Special – Viper Room',
          en: 'EVIL DISCO – Halloween Special – Viper Room',
        },
        paragraphs: {
          de: [
            'Gothic, Metal, Electro und Halloween-Classics: Im Viper Room auf der Landstraßer Hauptstraße legen Vagabund, Morrigan und Iguana auf, an den Wänden laufen klassische Horrorfilme. Wer als Zombie, Monster oder Hexe kommt, kann beim Kostümwettbewerb Konzerttickets gewinnen. Beginn 22:00 Uhr, Eintritt 8 €.',
          ],
          en: [
            'Gothic, metal, electro and Halloween classics: at the Viper Room on Landstraßer Hauptstraße, Vagabund, Morrigan and Iguana are on the decks while classic horror films run on the walls. Anyone turning up as a zombie, monster or witch can win concert tickets in the costume contest. Doors at 22:00, entry €8.',
          ],
        },
        eventUrl: '/event/evil-disco-halloween-special-3df12827',
        linkLabel: {
          de: 'Tickets für EVIL DISCO',
          en: 'Tickets for EVIL DISCO',
        },
      },
    ],
  },
  {
    id: 'abseits-vom-club',
    heading: { de: 'Halloween abseits vom Club', en: 'Halloween beyond the club' },
    entries: [
      {
        id: 'halloween-run',
        heading: {
          de: 'Persil Vienna Halloween Run – Prater (Freitag, 30. Oktober)',
          en: 'Persil Vienna Halloween Run – Prater (Friday, 30 October)',
        },
        paragraphs: {
          de: [
            'Schon am Freitag geht es im Prater gruselig los: Beim Persil Vienna Halloween Run läuft man auf der Prater Hauptallee über 5 km (Big Scare Run), 2,5 km (Little Fear Run) oder als Mini Monster Run für Kinder zwischen 3 und 9 Jahren. Kostüme sind nicht Pflicht, in jeder Kategorie wird aber das gruseligste Kostüm ausgezeichnet. Die Startgebühr liegt je nach Bewerb zwischen 18 und 35 €.',
            'Wer am Samstag feiern will, hat damit das perfekte Warm-up – und eine Ausrede, das Kostüm zweimal zu tragen.',
          ],
          en: [
            'Things get spooky in the Prater as early as Friday: at the Persil Vienna Halloween Run you take on 5 km (Big Scare Run), 2.5 km (Little Fear Run) on the Prater Hauptallee, or the Mini Monster Run for children between 3 and 9. Costumes are not compulsory, but the scariest one is awarded in every category. Entry fees run from €18 to €35 depending on the race.',
            'If you are heading out on Saturday, this is the perfect warm-up – and an excuse to wear the costume twice.',
          ],
        },
        eventUrl: '/event/persil-vienna-halloween-run-2026-3df12b2f',
        linkLabel: {
          de: 'Alle Infos zum Persil Vienna Halloween Run',
          en: 'All details on the Persil Vienna Halloween Run',
        },
      },
    ],
  },
]

// ──────────────────────────────────────────────────────────────
// Tipps
// ──────────────────────────────────────────────────────────────

export interface HalloweenTip {
  id: string
  title: Localized<string>
  text: Localized<string>
  /** Optionaler Link am Ende des Tipps (hier: Blogbeitrag). */
  link?: { href: string; label: Localized<string> }
}

export const TIPS_HEADING: Localized<string> = {
  de: 'Tipps für die Halloween-Nacht in Wien',
  en: 'Tips for Halloween night in Vienna',
}

export const TIPS: HalloweenTip[] = [
  {
    id: 'tickets',
    title: { de: 'Früh Tickets sichern.', en: 'Get tickets early.' },
    text: {
      de: 'Die meisten Preise oben sind Vorverkaufspreise. An der Abendkasse wird es meist teurer, und an einem Halloween-Samstag können beliebte Events schon vorher ausverkauft sein.',
      en: 'Most prices above are advance-sale prices. At the door it is usually more expensive, and on a Halloween Saturday popular events can sell out beforehand.',
    },
  },
  {
    id: 'age-limits',
    title: { de: 'Altersgrenzen checken.', en: 'Check the age limits.' },
    text: {
      de: 'Die Einlassregeln sind unterschiedlich: In der Ottakringer Brauerei kommst du ab 18 rein, im O – Der Klub erst ab 19. Nimm auf jeden Fall einen Ausweis mit.',
      en: 'Admission rules differ: the Ottakringer Brauerei lets you in from 18, O – Der Klub only from 19. Bring ID in any case.',
    },
  },
  {
    id: 'costume',
    title: { de: 'Kostüm lohnt sich.', en: 'A costume pays off.' },
    text: {
      de: 'Im Viper Room gibt es einen Kostümwettbewerb mit Konzerttickets als Preis, und beim Halloween Run wird in jeder Kategorie das gruseligste Kostüm ausgezeichnet.',
      en: 'The Viper Room runs a costume contest with concert tickets as the prize, and at the Halloween Run the scariest costume is awarded in every category.',
    },
  },
  {
    id: 'public-transport',
    title: { de: 'Mit den Öffis heim.', en: 'Take public transport home.' },
    text: {
      de: 'In der Nacht von Samstag auf Sonntag fährt die U-Bahn in Wien durchgehend. Du kommst also auch um vier Uhr früh problemlos nach Hause.',
      en: 'On the night from Saturday to Sunday, Vienna’s underground runs around the clock. So you will get home without trouble even at four in the morning.',
    },
  },
  {
    id: 'safety',
    title: {
      de: 'Pass auf dich und deine Leute auf.',
      en: 'Look after yourself and your people.',
    },
    text: {
      de: 'Gerade in vollen Clubs und mit Maske oder Make-up erkennt man sich schnell nicht mehr. Unsere Tipps dazu findest du im Beitrag',
      en: 'In crowded clubs, and with a mask or make-up on, people lose sight of each other quickly. You can find our tips on this in the post',
    },
    link: {
      href: 'https://blog.shareyourparty.de/sicher-auf-partys/',
      label: { de: 'Sicher auf Partys', en: 'Staying safe at parties' },
    },
  },
]

// ──────────────────────────────────────────────────────────────
// FAQ — eine Quelle für Accordion (View) und FAQPage (Schema)
// ──────────────────────────────────────────────────────────────

export interface FaqEntry {
  q: string
  a: string
}

export const FAQ_HEADING: Localized<string> = {
  de: 'Häufige Fragen zu Halloween in Wien',
  en: 'Frequently asked questions about Halloween in Vienna',
}

export const FAQS: Localized<FaqEntry[]> = {
  de: [
    {
      q: 'Wann ist Halloween 2026?',
      a: 'Halloween ist am Samstag, 31. Oktober 2026. Die meisten Partys starten am Samstagabend zwischen 21 und 23 Uhr. Einige Events wie der Persil Vienna Halloween Run finden schon am Freitag, 30. Oktober, statt.',
    },
    {
      q: 'Wo kann man in Wien Halloween feiern?',
      a: 'Die größten Halloween-Partys in Wien finden 2026 in der Ottakringer Brauerei, im O – Der Klub an der Oper, im Flex am Donaukanal und im Viper Room auf der Landstraßer Hauptstraße statt.',
    },
    {
      q: 'Was kostet eine Halloween-Party in Wien?',
      a: 'Die Preise reichen von 8 € im Viper Room über 15 € im Flex bis 40 € für den Warehouse Rave in der Ottakringer Brauerei. Im O – Der Klub starten die Tickets bei 17 € und gehen je nach Kategorie bis 79 €.',
    },
    {
      q: 'Muss ich verkleidet kommen?',
      a: 'Nein, bei keiner der genannten Partys ist ein Kostüm Pflicht. Bei mehreren Events wird es aber mit Preisen belohnt.',
    },
    {
      q: 'Gibt es Halloween-Events in Wien, die keine Party sind?',
      a: 'Ja. Der Persil Vienna Halloween Run im Prater findet bereits am Freitag, 30. Oktober, statt – mit Bewerben über 5 km, 2,5 km und einem Mini Monster Run für Kinder.',
    },
  ],
  en: [
    {
      q: 'When is Halloween 2026?',
      a: 'Halloween is on Saturday, 31 October 2026. Most parties start on Saturday evening between 21:00 and 23:00. Some events, such as the Persil Vienna Halloween Run, already take place on Friday, 30 October.',
    },
    {
      q: 'Where can you celebrate Halloween in Vienna?',
      a: 'In 2026 the largest Halloween parties in Vienna take place at the Ottakringer Brauerei, O – Der Klub near the opera, Flex on the Donaukanal and the Viper Room on Landstraßer Hauptstraße.',
    },
    {
      q: 'What does a Halloween party in Vienna cost?',
      a: 'Prices range from €8 at the Viper Room and €15 at Flex up to €40 for the warehouse rave at the Ottakringer Brauerei. At O – Der Klub tickets start at €17 and go up to €79 depending on the category.',
    },
    {
      q: 'Do I have to come in costume?',
      a: 'No, a costume is not compulsory at any of the parties listed. At several events, however, it is rewarded with prizes.',
    },
    {
      q: 'Are there Halloween events in Vienna that are not parties?',
      a: 'Yes. The Persil Vienna Halloween Run in the Prater already takes place on Friday, 30 October – with races over 5 km, 2.5 km and a Mini Monster Run for children.',
    },
  ],
}

// ──────────────────────────────────────────────────────────────
// Abschluss
// ──────────────────────────────────────────────────────────────

export const OUTRO_HEADING: Localized<string> = {
  de: 'Alle Halloween-Events auf Share Your Party',
  en: 'All Halloween events on Share Your Party',
}

export const OUTRO: Localized<{
  listText: string
  listLinkLabel: string
  organizerText: string
  organizerLinkLabel: string
}> = {
  de: {
    listText: 'Diese Liste wächst bis Ende Oktober weiter. Alle aktuellen Halloween-Partys in Wien mit Tickets und allen Infos findest du auf',
    listLinkLabel: 'Share Your Party',
    organizerText: 'Du veranstaltest selbst eine Halloween-Party in Wien?',
    organizerLinkLabel: 'Trag dein Event kostenlos ein',
  },
  en: {
    listText: 'This list keeps growing until the end of October. You can find all current Halloween parties in Vienna, with tickets and full details, on',
    listLinkLabel: 'Share Your Party',
    organizerText: 'Are you hosting a Halloween party in Vienna yourself?',
    organizerLinkLabel: 'List your event for free',
  },
}
