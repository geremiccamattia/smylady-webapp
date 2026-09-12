/**
 * Markdown-Auszeichnung entfernen — für Stellen, an denen der Text NICHT gerendert
 * wird und Sternchen oder Rauten sonst wörtlich zu sehen wären: Meta-Beschreibungen,
 * Open-Graph-Tags, Vorschautexte.
 *
 * Bewusst hier und nicht in MarkdownContent.tsx: Die Komponente ist ein
 * 'use client'-Modul, und generateMetadata() läuft auf dem Server. Ein Import von
 * dort würde die Funktion serverseitig zu einer Client-Referenz machen.
 *
 * Ebenso bewusst eine simple Textbereinigung und kein zweiter Parser: Das Ergebnis
 * landet in einem Attribut, in dem Restzeichen unschön, aber harmlos sind.
 */
export function stripMarkdown(text?: string | null): string {
  if (!text) return ''
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // Bilder → Alt-Text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Links → Linktext
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // Überschriften-Rauten
    .replace(/^\s{0,3}>\s?/gm, '') // Zitatzeichen
    .replace(/^\s{0,3}[-*+]\s+/gm, '') // Listenpunkte
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // fett
    .replace(/(\*|_)(.*?)\1/g, '$2') // kursiv
    .replace(/`([^`]*)`/g, '$1') // Code
    // Literale "\n"-Folgen: Ein Teil der Beschreibungen trägt den Umbruch als
    // zwei Zeichen (Backslash + n) statt als echten Zeilenumbruch. Die gerenderte
    // Ansicht macht daraus einen Umbruch, im Meta-Tag stünde sonst sichtbar "\n" —
    // also genau dort, wo Google den Text im Suchergebnis zeigt.
    // MUSS vor der Whitespace-Normalisierung stehen: Nur so werden mehrere
    // aufeinanderfolgende Folgen anschließend zu EINEM Leerzeichen zusammengezogen.
    // `\\n` steht für EIN Backslash-Zeichen gefolgt von "n" — die Gruppe um
    // `\\r` ist nötig, damit `?` nicht nur für das "r" gilt.
    .replace(/(?:\\r)?\\n/g, ' ')
    .replace(/\s+/g, ' ') // Zeilenumbrüche → Leerzeichen
    .trim()
}
