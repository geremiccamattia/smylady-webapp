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
              Unsere Websites benutzen Google Analytics, einen Webanalysedienst der Google Ireland Limited, einer nach irischem Recht eingetragenen und betriebenen Gesellschaft (Registernummer: 368047) mit Sitz in Gordon House, Barrow Street, Dublin 4, Irland. („Google“). Google verwendet dabei Cookies, die eine Analyse Ihrer Benutzung der Webseite ermöglichen. Die durch das Cookie erzeugten Informationen über Ihre Benutzung dieser Website (einschließlich Ihrer IP-Adresse) werden an einen Server von Google in den USA übertragen und dort gespeichert. Google kann diese Informationen ggf. an Dritte übertragen oder in sonstiger Weise verwerten, sodass eine direkte Personenbeziehbarkeit der so gesammelten Daten nicht mehr auszuschließen ist. Diese Website nutzt die Google-Analytics-Berichte zu demografischen Merkmalen, in denen Daten aus interessenbezogener Werbung von Google sowie Besucherdaten von Drittanbietern (z. B. Alter, Geschlecht und Interessen) verwendet werden. Diese Daten sind nicht auf eine bestimmte Person zurückzuführen und können jederzeit über die Anzeigeneinstellungen deaktiviert werden. Wir weisen Sie daher darauf hin, dass diese Webseite Google Analytics mit der Erweiterung „anonymize“ verwendet und daher Ihre IP-Adresse nur gekürzt weiterverarbeitet wird. Somit wird eine direkte Personenbeziehbarkeit ausgeschlossen. Dieser Anonymisierungscodezusatz stellt eine datenschutzrechtliche Weiterverarbeitung sicher. Sie können zudem der Installation der Cookies widersprechen, indem Sie für Ihren Browser ein sog. Deaktivierungs-Add-On herunterladen. Weiterführende Informationen finden Sie in der Datenschutzerklärung von Google: <a href="www.google.com/intl/de/policies/privacy/" className="text-primary hover:underline">www.google.com/intl/de/policies/privacy/</a>
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Die Nutzung von Analytics ist freiwillig und kann jederzeit widerrufen werden.
            </p>
          </section>
          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Googe Remarketing</h2>
            <p className="text-muted-foreground leading-relaxed">
             Diese Website verwendet Cookies, mit dem Zweck, die Besucher via Remarketing-Kampagnen mit Online Werbung zu einem späteren Zeitpunkt im Google Werbenetzwerk anzusprechen. Zur Schaltung von Remarketing-Anzeigen verwenden Drittanbieter wie Google Cookies auf der Grundlage eines Besuchs der vorliegenden Website. Sie als User haben die Möglichkeit, die Verwendung von Cookies durch Google zu deaktivieren, indem Sie die Seite zur Deaktivierung von Google unter <a href="https://myadcenter.google.com/home?hl=de&sasb=true&ref=ad-settings" className="text-primary hover:underline">https://adssettings.google.com/authenticated?hl=de</a> aufrufen oder auf der <a href="https://thenai.org/glossary/opt-out-mechanism/" className="text-primary hover:underline">Deaktivierungsseite der Network Advertising Initiative</a> die Nutzung von Cookies deaktivieren können.
              </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Die Nutzung von Analytics ist freiwillig und kann jederzeit widerrufen werden.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">7. Empfänger der Daten</h2>
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

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Speicherdauer</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die Daten werden gespeichert, solange dein Nutzerkonto besteht oder bis du deine Einwilligung widerrufst.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Nach Löschung des Accounts werden die Daten gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">9. Deine Rechte</h2>
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

          {/* Section 10 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">10. Freiwilligkeit</h2>
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
