import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Privacy() {
  const email = 'office@shareyourparty.de'
  const navigate = useNavigate()

  return (
    <div>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </button>

        <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>

        <div className="space-y-8 text-foreground">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Verantwortlicher</h2>
            <p className="text-muted-foreground leading-relaxed">
              Verantwortlich für die Datenverarbeitung ist:<br />
              Sherin Strobl und Mattia Geremicca von Share Your Party<br />
              E-Mail: <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a>
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">2. Zweck der Datenverarbeitung</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Die App wird im Rahmen eines Hochschulprojekts getestet und anschließend als reguläre Anwendung weiterbetrieben.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Die Verarbeitung personenbezogener Daten erfolgt zu folgenden Zwecken:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Bereitstellung und Betrieb der App</li>
              <li>Durchführung des App-Tests und Weiterentwicklung</li>
              <li>Nutzerverwaltung und Login</li>
              <li>Analyse des Nutzungsverhaltens (optional)</li>
              <li>Abwicklung eines optionalen Ticketkaufs</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">3. Verarbeitete Daten</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Je nach Nutzung der App werden folgende Daten verarbeitet:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Login-Daten (z. B. E-Mail-Adresse oder pseudonyme IDs bei "Sign in with Apple" / Google)</li>
              <li>Profildaten (z. B. Username, Alter, Wohnsitzland)</li>
              <li>Nutzungsdaten (z. B. Interaktionen innerhalb der App)</li>
              <li>Geräte- und technische Daten (z. B. App-Version, Browser)</li>
              <li>Zahlungsdaten nur im Falle eines Ticketkaufs (über externe Zahlungsanbieter)</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">4. Rechtsgrundlagen</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Die Verarbeitung erfolgt auf Grundlage von:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) – für App-Nutzung und Analytics</li>
              <li>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) – bei Ticketkäufen</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Analytics</h2>
            <p className="text-muted-foreground leading-relaxed">
              Sofern du eingewilligt hast, nutzen wir Firebase / Google Analytics, um das Nutzungsverhalten
              anonymisiert auszuwerten und die App zu verbessern.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Die Nutzung von Analytics ist freiwillig und kann jederzeit widerrufen werden.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Empfänger der Daten</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Personenbezogene Daten können an folgende Empfänger übermittelt werden:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Google LLC (Firebase, Google Analytics, Google Login)</li>
              <li>Apple Inc. (Sign in with Apple)</li>
              <li>Zahlungsdienstleister (nur beim Ticketkauf)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Mit allen Dienstleistern bestehen entsprechende Auftragsverarbeitungsverträge.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">7. Speicherdauer</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die Daten werden gespeichert, solange dein Nutzerkonto besteht oder bis du deine Einwilligung widerrufst.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Nach Löschung des Accounts werden die Daten gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Deine Rechte</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Du hast jederzeit das Recht auf:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Auskunft über deine gespeicherten Daten</li>
              <li>Berichtigung unrichtiger Daten</li>
              <li>Löschung deiner Daten</li>
              <li>Widerruf deiner Einwilligung</li>
              <li>Einschränkung der Verarbeitung</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Anfragen kannst du an <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a> richten.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">9. Freiwilligkeit</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die Nutzung der App ist freiwillig.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Die Teilnahme oder Nicht-Teilnahme hat keine Auswirkungen auf Studium, Prüfungen oder Bewertungen.
            </p>
          </section>
        </div>

      </div>
    </div>
  )
}
