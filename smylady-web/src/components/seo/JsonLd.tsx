/**
 * Gibt ein Objekt als <script type="application/ld+json"> aus.
 *
 * Bewusst eine Server-Komponente ohne 'use client': Strukturierte Daten müssen
 * im initialen HTML stehen. Suchmaschinen rendern zwar JavaScript, die meisten
 * KI-Crawler nicht — genau daran ist die Grounding-Seite schon einmal
 * gescheitert.
 *
 * `<` wird zu `<` maskiert. Ohne das könnte ein `</script>` aus einem
 * Eventnamen oder einer Beschreibung den Block vorzeitig schließen und den Rest
 * als Markup in die Seite bringen. JSON versteht die Escape-Sequenz, der Wert
 * bleibt unverändert.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
