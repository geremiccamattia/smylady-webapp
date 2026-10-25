/**
 * Kuratierung der Seite /events/weihnachtsmaerkte-wien.
 *
 * Quelle der Wahrheit sind die Events der Kategorie „Weihnachten" in Wien
 * (lib/weihnachtenWien.ts). Diese Datei ERGÄNZT sie nur — verknüpft über die
 * Event-ID, nicht über den Namen, damit eine Umbenennung nichts kaputt macht.
 *
 * Hier stehen Gruppe und Badges. Die Texte dazu (redaktioneller Kurztext,
 * Öffi-Anbindung) stehen in beiden Sprachen in den Übersetzungsdateien:
 *   src/i18n/locales/de.json und en.json
 *   → christmasVienna.curated.<Event-ID>.text
 *   → christmasVienna.curated.<Event-ID>.transit
 *
 * Ein Event ergänzen:
 *   1. Die Event-ID (24 Zeichen, steht am Ende der Event-URL) hier als Schlüssel
 *      eintragen, mit Gruppe und optional Badges.
 *   2. In de.json UND en.json unter christmasVienna.curated denselben Schlüssel
 *      mit "text" und "transit" anlegen.
 * Fehlt eins davon, bleibt die Seite trotzdem heil: Ein Event ohne Eintrag hier
 * landet in „Weitere Weihnachtsevents in Wien", ein Eintrag ohne Text zeigt die
 * Beschreibung des Veranstalters. Einträge zu gelöschten Events werden ignoriert.
 *
 * Quelle der Kuratierung: die Beschreibungen der Veranstalter (Stand Oktober
 * 2026), insbesondere deren Angaben zur Anreise.
 */

/** Gruppen in Anzeigereihenfolge. Titel und Einleitung: christmasVienna.groups.<id>. */
export const CHRISTMAS_GROUPS = ['innenstadt', 'schloesser', 'kunsthandwerk', 'abseits'] as const
export type ChristmasGroupId = (typeof CHRISTMAS_GROUPS)[number]

/** Kuratierte Badges. Beschriftung: christmasVienna.badges.<id>. */
export const CHRISTMAS_BADGES = ['landmark', 'crafts', 'museums', 'family', 'curling', 'newYearsEve'] as const
export type ChristmasBadgeId = (typeof CHRISTMAS_BADGES)[number]

export interface CuratedMarket {
  group: ChristmasGroupId
  badges?: ChristmasBadgeId[]
}

export const CURATED_MARKETS: Record<string, CuratedMarket> = {
  // Innere Stadt
  '6ad4f9444cb38af994bb48e0': { group: 'innenstadt', badges: ['landmark'] }, // Weihnachtsmarkt Rathausplatz
  '6ad6718e4cb38af994be12f4': { group: 'innenstadt' }, // Weihnachtsdorf am Stephansplatz
  '6ad66ff34cb38af994bdf267': { group: 'innenstadt', badges: ['crafts'] }, // Weihnachtsmarkt Am Hof
  '6ad66e524cb38af994bdd220': { group: 'innenstadt', badges: ['crafts'] }, // Altwiener Christkindlmarkt Freyung
  '6ad669964cb38af994bd7a8b': { group: 'innenstadt', badges: ['museums'] }, // Weihnachtsdorf am Maria-Theresien-Platz
  '6ad679e44cb38af994bea739': { group: 'innenstadt' }, // Weihnachtszauber am Schwarzenbergplatz

  // Schlösser & Wahrzeichen
  '6ad66b7f4cb38af994bda32e': { group: 'schloesser', badges: ['landmark'] }, // Weihnachtsmarkt Schloss Schönbrunn
  '6ad66d694cb38af994bdc579': { group: 'schloesser', badges: ['landmark'] }, // K&K Weihnachtsmarkt Schloss Belvedere
  '6ad67b6a4cb38af994bec77e': { group: 'schloesser', badges: ['newYearsEve'] }, // Wintermarkt am Riesenradplatz

  // Kunst & Kunsthandwerk
  '6ad6762c4cb38af994be5bb0': { group: 'kunsthandwerk', badges: ['crafts'] }, // Weihnachtsmarkt am Spittelberg
  '6ad673344cb38af994be2cef': { group: 'kunsthandwerk', badges: ['crafts'] }, // Art Advent am Karlsplatz

  // Abseits vom Trubel
  '6ad67ce94cb38af994bee44a': { group: 'abseits', badges: ['family'] }, // Weihnachtsmarkt im Türkenschanzpark
  '6ad6787f4cb38af994be8e8d': { group: 'abseits', badges: ['curling'] }, // Weihnachtsdorf am Campus der Universität Wien
  '6ad67e724cb38af994bf016f': { group: 'abseits', badges: ['family'] }, // Weihnachtsausstellung Blumengärten Hirschstetten
}
