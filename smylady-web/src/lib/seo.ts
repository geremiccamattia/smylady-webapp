/**
 * Kanonische URLs und hreflang-Sätze.
 *
 * Vorher stand in jeder der 29 Seiten ein handgeschriebener alternates-Block, der
 * jeweils nur die ANDERE Sprache nannte — ohne Selbstverweis und ohne x-default.
 * Google wertet unvollständige hreflang-Sätze nicht aus. Bei /grounding fehlte der
 * Block auf der deutschen Seite sogar ganz, während die englische ihn hatte.
 *
 * Deshalb hier eine Stelle statt 29 Kopien: Der Satz ist damit automatisch
 * vollständig und symmetrisch, und eine neue Seite kann ihn nicht halb vergessen.
 */

export const SITE_URL = 'https://shareyourparty.de'

export type Locale = 'de' | 'en'

/**
 * @param path Pfad OHNE Sprachpräfix, immer mit führendem Slash — z.B. '/explore'
 *             oder `/event/${slug}`. Die englische Fassung liegt unter /en + path.
 * @param locale Sprache DIESER Seite (bestimmt den canonical).
 *
 * x-default zeigt auf die deutsche Fassung: Deutsch ist der Primärmarkt und liegt
 * auf dem nackten Pfad.
 */
export function localeAlternates(path: string, locale: Locale) {
  const de = `${SITE_URL}${path}`
  const en = `${SITE_URL}/en${path}`

  return {
    canonical: locale === 'de' ? de : en,
    languages: {
      de,
      en,
      'x-default': de,
    },
  }
}

/** Kanonische URL derselben Seite — für og:url, das die Seite selbst nennen muss. */
export function canonicalUrl(path: string, locale: Locale): string {
  return locale === 'de' ? `${SITE_URL}${path}` : `${SITE_URL}/en${path}`
}
