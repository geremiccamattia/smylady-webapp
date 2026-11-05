/**
 * Datenmodell der Rechtstexte (Impressum, AGB, Datenschutzerklärung).
 *
 * Die Texte liegen bewusst als reine Daten vor und nicht als JSX:
 *  - Web (Next.js) und App (Expo, nativ + Web) rendern denselben Inhalt,
 *    damit es nie wieder abweichende Fassungen gibt.
 *  - Der Inhalt lässt sich ohne Browser prüfen, versionieren und vergleichen.
 *
 * Inline-Auszeichnung in Texten:
 *  - Links:   [Linktext](https://example.org)  bzw. interne Pfade [AGB](/terms)
 *  - Fett:    **Text**
 */

export type LegalLanguage = 'de' | 'en'

export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  /** Zweispaltige Tabelle, z. B. Speicherfristen oder Empfänger. */
  | { type: 'table'; head: [string, string]; rows: Array<[string, string]> }
  /** Hervorgehobener Hinweis, z. B. Widerrufsbelehrung. */
  | { type: 'note'; text: string }

export interface LegalSection {
  /** Stabiler Anker, z. B. "scope" → #scope */
  id: string
  title: string
  blocks: LegalBlock[]
}

export interface LegalDocument {
  kind: 'terms' | 'privacy' | 'imprint'
  language: LegalLanguage
  title: string
  /** Kurzform für Menüs und Seitentitel. */
  shortTitle: string
  /** Versionskennung, wird bei Zustimmungen mitgespeichert. */
  version: string
  /** Datum, ab dem diese Fassung gilt (ISO, YYYY-MM-DD). */
  effectiveDate: string
  intro?: LegalBlock[]
  sections: LegalSection[]
  /** Hinweis am Ende, z. B. "Stand: …" */
  footer?: string
}

export type InlineNode =
  | { kind: 'text'; text: string }
  | { kind: 'link'; text: string; href: string }
  | { kind: 'bold'; text: string }

/**
 * Zerlegt einen Absatz in Text-, Link- und Fett-Knoten.
 * Bewusst klein gehalten; verschachtelte Auszeichnung wird nicht unterstützt.
 */
export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = []
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push({ kind: 'text', text: text.slice(last, match.index) })
    }
    if (match[1] !== undefined) {
      nodes.push({ kind: 'link', text: match[1], href: match[2] })
    } else {
      nodes.push({ kind: 'bold', text: match[3] })
    }
    last = match.index + match[0].length
  }
  if (last < text.length) {
    nodes.push({ kind: 'text', text: text.slice(last) })
  }
  return nodes
}

/** Entfernt die Inline-Auszeichnung, z. B. für reine Textausgaben. */
export function stripInline(text: string): string {
  return parseInline(text)
    .map(node => node.text)
    .join('')
}

/** Datum einer Fassung lesbar formatieren. */
export function formatLegalDate(iso: string, language: LegalLanguage): string {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.toLocaleDateString(language === 'en' ? 'en-GB' : 'de-AT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
