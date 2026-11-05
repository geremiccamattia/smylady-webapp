/**
 * Betreiberdaten für Impressum, AGB und Datenschutzerklärung.
 *
 * Einzige Stelle, an der Name, Anschrift und Kennzahlen des Betreibers stehen.
 * Die Rechnungsstellung des Backends (BILLING_ISSUER_*) muss dieselben Werte
 * tragen.
 *
 * Felder mit `null` sind noch nicht bekannt und werden in den Texten
 * ausgelassen. Vor dem Livegang ausfüllen (siehe Prüfbericht):
 *  - legalForm:        Rechtsform bzw. Firma laut Gewerberegister/Firmenbuch
 *  - vatId:            UID-Nummer (ATU…), sobald vorhanden
 *  - gisaNumber:       GISA-Zahl der Gewerbeberechtigung
 *  - tradeDescription: Wortlaut der Gewerbeberechtigung
 *  - companyRegister:  Firmenbuchnummer und -gericht, falls eingetragen
 *  - phone:            Telefonnummer (empfohlen, nicht Pflicht)
 */
export const OPERATOR = {
  brand: 'Share Your Party',
  /** Natürliche Personen, die den Dienst gemeinsam betreiben. */
  owners: ['Sherin Strobl', 'Mattia Geremicca'] as const,
  legalForm: null as string | null,
  street: 'Polgarstraße 13E/13',
  postalCode: '1220',
  city: 'Wien',
  country: { de: 'Österreich', en: 'Austria' },
  email: 'office@shareyourparty.de',
  phone: null as string | null,
  website: 'https://www.shareyourparty.de',
  vatId: null as string | null,
  gisaNumber: null as string | null,
  tradeDescription: null as string | null,
  companyRegister: null as string | null,
  /** Zuständige Gewerbebehörde für 1220 Wien. */
  tradeAuthority: {
    de: 'Magistratisches Bezirksamt für den 22. Bezirk, Wien',
    en: 'Municipal District Office for the 22nd District, Vienna',
  },
  chamber: {
    de: 'Wirtschaftskammer Wien',
    en: 'Vienna Chamber of Commerce (Wirtschaftskammer Wien)',
  },
  /** Zuständige Aufsichtsbehörde für den Datenschutz. */
  dataProtectionAuthority: {
    name: { de: 'Österreichische Datenschutzbehörde', en: 'Austrian Data Protection Authority' },
    street: 'Barichgasse 40-42',
    postalCode: '1030',
    city: 'Wien',
    phone: '+43 1 52 152-0',
    email: 'dsb@dsb.gv.at',
    website: 'https://www.dsb.gv.at',
  },
  /** Verbraucherschlichtung (AStG) – Zuständige Stelle für Online-Geschäfte. */
  consumerArbitration: {
    name: 'Internet Ombudsstelle',
    website: 'https://www.ombudsstelle.at',
  },
  storeLinks: {
    ios: 'https://apps.apple.com/at/app/share-your-party/id6748308083',
    android: 'https://play.google.com/store/apps/details?id=com.shareyourparty.app',
  },
}

export function operatorDisplayName(): string {
  return OPERATOR.legalForm ? `${OPERATOR.brand} – ${OPERATOR.legalForm}` : OPERATOR.brand
}

export function operatorOwnersLine(): string {
  return OPERATOR.owners.join(' und ')
}

export function operatorOwnersLineEn(): string {
  return OPERATOR.owners.join(' and ')
}

export function operatorAddressLine(language: 'de' | 'en'): string {
  return `${OPERATOR.street}, ${OPERATOR.postalCode} ${OPERATOR.city}, ${OPERATOR.country[language]}`
}
