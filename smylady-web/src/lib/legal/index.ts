/**
 * Zentraler Zugriff auf die Rechtstexte.
 *
 * Dieses Verzeichnis (src/lib/legal) ist identisch mit src/legal in der
 * Expo-App (smylady-frontend). Änderungen immer in beiden Repos nachziehen,
 * bis die Webapp auf die Expo-Codebasis umgestellt ist.
 */
import { getImprint, IMPRINT_VERSION } from './imprint'
import { PRIVACY_DE, PRIVACY_VERSION } from './privacy.de'
import { PRIVACY_EN } from './privacy.en'
import { TERMS_DE, TERMS_VERSION } from './terms.de'
import { TERMS_EN } from './terms.en'
import type { LegalDocument, LegalLanguage } from './types'

export * from './types'
export { OPERATOR } from './operator'
export { IMPRINT_VERSION, PRIVACY_VERSION, TERMS_VERSION }

export function toLegalLanguage(language: string | undefined | null): LegalLanguage {
  return language?.toLowerCase().startsWith('en') ? 'en' : 'de'
}

export function getTerms(language: string | undefined | null): LegalDocument {
  return toLegalLanguage(language) === 'en' ? TERMS_EN : TERMS_DE
}

export function getPrivacy(language: string | undefined | null): LegalDocument {
  return toLegalLanguage(language) === 'en' ? PRIVACY_EN : PRIVACY_DE
}

export function getImprintDocument(language: string | undefined | null): LegalDocument {
  return getImprint(toLegalLanguage(language))
}

/** Pfade der Rechtsseiten je Sprache (Webapp-Routing). */
export function legalPath(kind: LegalDocument['kind'], language: string | undefined | null): string {
  const base = kind === 'terms' ? '/terms' : kind === 'privacy' ? '/privacy' : '/imprint'
  return toLegalLanguage(language) === 'en' ? `/en${base}` : base
}
