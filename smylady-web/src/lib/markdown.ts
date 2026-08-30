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
    .replace(/\s+/g, ' ') // Zeilenumbrüche → Leerzeichen
    .trim()
}
