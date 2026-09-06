/**
 * Wächter: hält die beiden Musikrichtungs-Listen dieses Repos deckungsgleich.
 *
 * Geprüft werden die beiden TypeScript-Listen:
 *   1. src/lib/eventFields.ts    — MUSIC_TYPE_VALUES, die Auswahl in den Formularen
 *   2. src/views/ApiDocsPage.tsx — MUSIC_TYPES, die Doku für den CSV-/API-Import
 *
 * Zusammenführen lassen sie sich nicht sinnvoll: Die Formularliste trägt deutsche
 * Labels und eine bewusst gewählte Sortierung nach Genre-Nähe, die Doku-Liste
 * nennt nur die Rohwerte in der Reihenfolge des Backend-Enums. Verglichen wird
 * deshalb die Wertemenge, nicht die Reihenfolge.
 *
 * NICHT MITGEPRÜFT, eine dritte Kopie im selben Repo: public/openapi.json unter
 * `components.schemas.MusicType`. Sie stand beim Anlegen dieses Wächters mit
 * denselben 24 Werten deckungsgleich da, ist als JSON-Datei aber kein Literal-Typ
 * — TypeScript liest sie als `string[]` und kann daraus keine Prüfung ableiten.
 * Wer hier etwas ergänzt, muss sie von Hand nachziehen.
 *
 * DIE VIERTE LISTE LIEGT IM BACKEND und lässt sich von hier aus erst recht nicht
 * mitprüfen:
 * `MusicType` in smylady-backend/src/types/common.ts. Sie ist die eigentlich
 * maßgebliche — das Backend validiert mit `@IsEnum(MusicType, { each: true })`
 * und antwortet auf einen unbekannten Wert mit 400. Wer hier einen Wert ergänzt,
 * muss ihn also zusätzlich im Backend-Enum nachziehen; dieser Wächter merkt davon
 * nichts. Genau dieser Abgleich fehlte zuvor und hatte `hiphop` (statt `hip_hop`)
 * in constants.ts stehen lassen — jedes Speichern mit dieser Auswahl schlug fehl.
 *
 * Der Wächter ist bewusst rein typseitig statt als Testdatei: Die WebApp hat
 * keinen Test-Runner (kein jest, kein vitest, keine Testdateien). Eine .spec-Datei
 * würde hier nie ausgeführt. `next build` dagegen typprüft ganz `src/` — auch
 * Dateien, die niemand importiert. Der Fehler erscheint damit im Build, den ohnehin
 * jeder Deploy durchläuft.
 */

import type { ApiDocsMusicType } from '@/views/ApiDocsPage'
import { MUSIC_TYPE_VALUES } from '@/lib/eventFields'

type EventFieldsMusicType = (typeof MUSIC_TYPE_VALUES)[number]['value']

/**
 * Erzwingt eine leere Differenz. Bleibt ein Wert übrig, nennt der Compiler ihn
 * beim Namen: „Type '"drill"' does not satisfy the constraint 'never'“.
 */
type AssertNoneMissing<Missing extends never, _Hinweis extends string> = Missing

// Ein Wert wurde in eventFields.ts ergänzt, in ApiDocsPage.tsx aber nicht.
export type _MusicTypeMissingInApiDocs = AssertNoneMissing<
  Exclude<EventFieldsMusicType, ApiDocsMusicType>,
  'Wert fehlt in MUSIC_TYPES in src/views/ApiDocsPage.tsx'
>

// Ein Wert wurde in ApiDocsPage.tsx ergänzt, in eventFields.ts aber nicht.
export type _MusicTypeMissingInEventFields = AssertNoneMissing<
  Exclude<ApiDocsMusicType, EventFieldsMusicType>,
  'Wert fehlt in MUSIC_TYPE_VALUES in src/lib/eventFields.ts'
>
