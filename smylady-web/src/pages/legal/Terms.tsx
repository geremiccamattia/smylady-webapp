import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Terms() {
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

        <h1 className="text-3xl font-bold mb-8">Allgemeine Geschäftsbedingungen</h1>

        <div className="space-y-8 text-foreground">
          {/* Section 1 */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">1. Geltungsbereich</h2>
            <p className="text-muted-foreground leading-relaxed">
              Diese Allgemeinen Geschäftsbedingungen regeln die Nutzung der mobilen Anwendung und
              Web-Applikation "Share Your Party", mit der Benutzer eigene Events erstellen, Tickets
              verkaufen und an Events teilnehmen können. Der Anbieter ist Share Your Party, mit Sitz
              in Österreich (EU).
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">2. Benutzerrollen</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Es gibt zwei Benutzerrollen:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li><strong>Gastgeber (Veranstalter)</strong> - Können Events erstellen und Tickets verkaufen</li>
              <li><strong>Gast (Teilnehmer)</strong> - Können Events besuchen und Tickets kaufen</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">3. Buchung & Ticketverkauf</h2>
            <p className="text-muted-foreground leading-relaxed">
              Gastgeber können Events erstellen und Tickets zu frei wählbaren Preisen zwischen 1 EUR
              und 200 EUR verkaufen. Gäste können Tickets über die App kaufen und erhalten diese nach
              Zahlungseingang als digitale Eintrittskarten mit QR-Code.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">4. Kosten und Gebühren</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Die Nutzung der App „Share Your Party" ist grundsätzlich kostenlos. Für das Erstellen von Events sowie den Kauf von Tickets erhebt die Plattform selbst keine zusätzlichen Gebühren.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Zahlungen innerhalb der App werden über den Zahlungsdienstleister Stripe abgewickelt.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Dabei gilt:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Für Ticketkäufer entstehen keine zusätzlichen Gebühren durch die Plattform. Der angezeigte Ticketpreis entspricht dem zu zahlenden Gesamtbetrag, sofern nicht anders angegeben.</li>
              <li>Für Veranstalter (Verkäufer von Tickets) können Gebühren des Zahlungsdienstleisters Stripe anfallen. Diese werden direkt von den Einnahmen abgezogen.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Die Höhe der Gebühren richtet sich nach den jeweils aktuellen Konditionen von Stripe und kann je nach Zahlungsmethode, Land und Währung variieren.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">5. Zahlungsabwicklung</h2>
            <p className="text-muted-foreground leading-relaxed">
              Zahlungen erfolgen über Drittanbieter (z. B. Stripe, PayPal). Es gelten zusätzlich die AGB
              dieser Anbieter. Die Zahlungsabwicklung erfolgt sicher und verschlüsselt gemäß den geltenden
              Sicherheitsstandards.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">6. Stornierung & Rückerstattung</h2>
            <p className="text-muted-foreground leading-relaxed">
              Rückerstattungen erfolgen nur, wenn die Veranstaltung vom Gastgeber abgesagt wird. In anderen
              Fällen besteht kein automatischer Anspruch auf Rückerstattung. Tickets können vor Eventbeginn
              storniert werden, sofern das Ticket noch nicht gescannt wurde.
            </p>
          </section>

          {/* Section 7 */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">7. Pflichten der Benutzer</h2>
            <div className="text-muted-foreground leading-relaxed space-y-3">
              <p>
                <strong>Gastgeber</strong> sind verpflichtet, korrekte Informationen zur Veranstaltung
                bereitzustellen und für deren ordnungsgemäße Durchführung verantwortlich. Sie müssen alle
                geltenden Gesetze und Vorschriften einhalten.
              </p>
              <p>
                <strong>Gäste</strong> müssen sich während der Teilnahme respektvoll verhalten und die
                Hausordnung des Veranstaltungsortes beachten.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">8. Verhaltenskodex</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Alle Benutzer verpflichten sich zu:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Gewährleistung einer sicheren und respektvollen Umgebung für alle</li>
              <li>Null-Toleranz gegenüber jeglicher Form von Belästigung, Diskriminierung oder Gewalt</li>
              <li>Einhaltung aller gesetzlichen Bestimmungen und behördlichen Auflagen</li>
              <li>Verantwortungsvoller Umgang mit Alkoholausschank (Jugendschutz beachten)</li>
              <li>Transparente Kommunikation über eventspezifische Risiken</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">9. Haftungsausschluss</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die App haftet nicht für Inhalte, Durchführung oder Sicherheit von durch Benutzer organisierten
              Veranstaltungen. Die Verantwortung liegt beim jeweiligen Veranstalter. Share Your Party stellt
              lediglich die Plattform zur Verfügung.
            </p>
          </section>

          {/* Section 10 */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">10. Kontosperrung</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bei schwerwiegenden Verstößen gegen diese AGB oder den Verhaltenskodex behält sich Share Your
              Party das Recht vor, Benutzerkonten vorübergehend oder dauerhaft zu sperren. Straftaten werden
              konsequent zur Anzeige gebracht.
            </p>
          </section>

          {/* Section 11 */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">11. Schlussbestimmungen</h2>
            <p className="text-muted-foreground leading-relaxed">
              Diese Allgemeinen Geschäftsbedingungen unterliegen dem Recht der Europäischen Union.
              Gerichtsstand ist der Sitz des Betreibers der App in Österreich. Sollten einzelne
              Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen
              davon unberührt.
            </p>
          </section>
        </div>

      </div>
    </div>
  )
}
