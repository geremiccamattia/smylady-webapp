import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

/*
 * ESLint-Einstieg in einen gewachsenen Bestand.
 *
 * Der erste Lauf gegen die Presets ergab 707 Treffer in 362 Dateien, davon 552
 * als Fehler. Eine Konfiguration, die so viel rot meldet, wird nicht benutzt —
 * deshalb ist hier bewusst nur das ein Fehler, was auf einen echten Defekt
 * hindeutet. Alles andere warnt und bildet den Aufräum-Rückstand ab.
 *
 * Die Zahlen in den Kommentaren sind der Stand des ersten Laufs. Sie stehen
 * dort als Maßstab: Sinkt eine davon auf null, kann die Regel scharf gestellt
 * werden.
 */
export default defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    /*
     * Das Muster ist exakt das von eslint-config-next und nicht zufällig
     * gewählt: In der Flat Config gehören Plugins dem Objekt, das sie lädt.
     * Griffe dieses Objekt für eine Datei, die die Presets nicht abdecken —
     * etwa die .cjs-Hilfsskripte im Projektwurzelverzeichnis, die das Muster
     * unten nicht enthält —, bräche ESLint mit „could not find plugin
     * react-hooks" ab, bevor überhaupt etwas geprüft wird.
     */
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    rules: {
      // ── Fehler: deuten auf echte Defekte ────────────────────────────────
      /*
       * Ungenutzte Variablen sind oft ein halb fertiger Umbau — eine Zuweisung,
       * die ins Leere läuft, oder ein Import, der nach dem Entfernen des
       * Aufrufs stehen blieb.
       *
       * args/caughtErrors auf 'none': Ein nicht verwendeter Funktions- oder
       * catch-Parameter ist meist von der Signatur vorgegeben und kein Fehler.
       * Das `^_`-Muster lässt die Fälle durch, die jemand bewusst so markiert
       * hat (_onReaction, _currentUserId).
       */
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'none',
          caughtErrors: 'none',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // Ein Hook in einer Bedingung oder Schleife zerstört die Hook-Reihenfolge
      // und äußert sich als sprunghafter, schwer auffindbarer Zustandsfehler.
      // Stand: 0 Treffer — bleibt scharf, damit das so bleibt.
      'react-hooks/rules-of-hooks': 'error',
      // Eine im JSX verwendete, aber nirgends definierte Komponente ist ein
      // sicherer Laufzeitfehler. Stand: 0 Treffer.
      'react/jsx-no-undef': 'error',
      /*
       * Fehlende keys lassen React Komponenten beim Sortieren oder Filtern
       * einer Liste falsch wiederverwenden — falsche Daten in Karten,
       * springende Eingabefelder. Die 66 Treffer des ersten Laufs waren
       * sämtlich falsch positiv und stammten aus einer einzigen Datei, die
       * dafür eine begründete Ausnahme trägt (views/ApiDocsPage.tsx).
       */
      'react/jsx-key': 'error',
      /*
       * Unvollständige Abhängigkeiten sind die Quelle veralteter Anzeigen,
       * doppelter Abfragen und Endlosschleifen: Der Effekt arbeitet dann mit
       * Werten aus einem früheren Render.
       *
       * Die verbliebenen Stellen, an denen die Liste bewusst kurz bleibt,
       * tragen vor Ort ein eslint-disable-next-line mit Begründung. Jede neue
       * Abweichung muss diesen Weg ebenfalls gehen und wird damit zur
       * bewussten Entscheidung statt zum Versehen.
       */
      'react-hooks/exhaustive-deps': 'error',

      // ── Warnungen: Altlasten, nach Häufigkeit ───────────────────────────
      /*
       * 366 Treffer, mit Abstand die größte Gruppe. `any` steckt vor allem in
       * den API-Antworten, für die es keine generierten Typen gibt. Das sauber
       * zu typisieren ist ein eigenes Vorhaben, kein Nebenbei-Fix.
       */
      '@typescript-eslint/no-explicit-any': 'warn',
      /*
       * 48 Treffer. Nicht maskierte Apostrophe in deutschen Texten. Rein
       * kosmetisch; React gibt den Text korrekt aus.
       */
      'react/no-unescaped-entities': 'warn',
      /*
       * Abgeschaltet, nicht auf 'warn' zurückgestuft.
       *
       * Alle 35 Treffer wurden einzeln durchgesehen: Kein einziger war ein
       * Fehler. Die Regel warnt pauschal vor setState im Effekt, trifft damit
       * aber genau die vier Muster, für die Effekte gedacht sind:
       *
       *   1. Zurücksetzen bei Prop-Wechsel — etwa setDisplaySrc(src), wenn ein
       *      neues Bild hereinkommt (ImageViewer, StoryViewer, image-crop-modal).
       *   2. Lesen aus localStorage/sessionStorage beim Mount — ein externes
       *      System (Register, RafflePromoBanner, ApiDocsPage, Settings).
       *   3. Formular aus Serverdaten füllen, sobald die Abfrage da ist
       *      (EditEvent, Profile, CommunityDetailPage).
       *   4. Debounce-Zurücksetzen: Trefferliste leeren, solange die Eingabe zu
       *      kurz ist (CreateEvent, EditEvent).
       *
       * Dazu kommen Fehlmeldungen, bei denen die Regel connect()/disconnect()
       * für State-Setter hält (SocketContext).
       *
       * Als Warnung stünde sie dauerhaft im Rauschen und verdeckte echte
       * Befunde, ohne je etwas zu finden. 35 Einzelausnahmen im Code wären
       * dasselbe, nur verstreut.
       */
      'react-hooks/set-state-in-effect': 'off',
      // 10 Treffer. Direkte Mutation von Props oder State in Komponenten.
      'react-hooks/immutability': 'warn',
      // 10 Treffer. Komponenten, die in einer anderen Komponente definiert
      // werden und bei jedem Render neu entstehen.
      'react-hooks/static-components': 'warn',
      /*
       * 7 Treffer. require() in einzelnen Hilfsskripten des Projekts, die als
       * CommonJS laufen und dort korrekt sind.
       */
      '@typescript-eslint/no-require-imports': 'warn',
      /*
       * 4 Treffer. <a> statt <Link> für interne Ziele. Funktioniert, kostet
       * aber die clientseitige Navigation.
       */
      '@next/next/no-html-link-for-pages': 'warn',
      // 2 Treffer. @ts-ignore statt @ts-expect-error.
      '@typescript-eslint/ban-ts-comment': 'warn',
      // 2 Treffer. Seiteneffekte während des Renderns.
      'react-hooks/purity': 'warn',
      // 1 Treffer.
      'react-hooks/use-memo': 'warn',
      // 1 Treffer. `{}` als Typ.
      '@typescript-eslint/no-empty-object-type': 'warn',
    },
  },

  /*
   * Altlasten von no-unused-vars.
   *
   * Die Regel ist oben scharf, damit sie in neuem Code sofort greift. In diesen
   * Dateien gibt es zusammen 12 Fundstellen aus der Zeit davor — ungenutzte
   * Importe und Zuweisungen. Sie warnen nur, bis jemand sie entfernt; danach
   * kann dieser Block ersatzlos verschwinden.
   *
   * Bewusst eine Dateiliste und kein globales 'warn': So wächst der Rückstand
   * nicht weiter, und man sieht auf einen Blick, was noch offen ist.
   */
  {
    /*
     * Dateinamen statt voller Pfade, und das mit Absicht: In Glob-Mustern sind
     * Klammern Sonderzeichen. Ein Pfad wie
     * 'src/app/(de)/(app)/event/[id]/EventDetailClient.tsx' läse sich als
     * Gruppe und Zeichenklasse und träfe die Datei nie — bei Next-Routen mit
     * Route-Groups und dynamischen Segmenten eine leicht zu übersehende Falle.
     */
    files: [
      '**/EventDetailClient.tsx',
      '**/teilnahmebedingungen/page.tsx',
      'src/hooks/use-toast.ts',
      'src/lib/popupWien.ts',
      'src/views/CreateEvent.tsx',
      'src/views/Explore.tsx',
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'none',
          caughtErrors: 'none',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  /*
   * no-undef nur außerhalb von TypeScript.
   *
   * In .ts/.tsx ist die Regel abgeschaltet, und zwar nicht aus Nachlässigkeit:
   * typescript-eslint rät ausdrücklich davon ab, weil der Compiler unbekannte
   * Bezeichner zuverlässiger findet und ESLint hier Typnamen und globale
   * Objekte fälschlich anmahnt. In reinen JS-Dateien gibt es diese Prüfung
   * nicht, dort bleibt die Regel scharf.
   */
  {
    files: ['**/*.{js,mjs,cjs}'],
    rules: {
      'no-undef': 'error',
    },
  },

  /*
   * CommonJS-Hilfsskripte im Projektwurzelverzeichnis (compare_keys.cjs).
   *
   * Sie laufen direkt unter Node, nicht im Bundle. `require` und `module` sind
   * dort richtig und kein Altlast-Fall — die Regel gegen require() stammt aus
   * dem TypeScript-Preset, das ohne Dateifilter gilt. Die Globals müssen
   * ebenfalls bekannt sein, sonst meldet no-undef jedes `console`.
   */
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        exports: 'writable',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'node_modules/**',
    '.vercel/**',
    'next-env.d.ts',
  ]),
])
