'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

export default function Terms() {
  const router = useRouter()
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')

  if (isEnglish) {
    return (
      <div>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold mb-8">Terms &amp; Conditions</h1>
          <div className="space-y-8 text-foreground">

            <section className="bg-card rounded-lg p-6 border">
              <h2 className="text-xl font-semibold mb-3">1. Scope</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms &amp; Conditions govern the use of the mobile application and web application "Share Your Party", which allows users to create their own events, sell tickets and attend events. The provider is Share Your Party, based in Austria (EU).
              </p>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <h2 className="text-xl font-semibold mb-3">2. User Roles</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">There are two user roles:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Host (Organiser)</strong> – Can create events and sell tickets</li>
                <li><strong>Guest (Attendee)</strong> – Can attend events and purchase tickets</li>
              </ul>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <h2 className="text-xl font-semibold mb-3">3. Booking &amp; Ticket Sales</h2>
              <p className="text-muted-foreground leading-relaxed">
                Hosts can create events and sell tickets at freely chosen prices between €1 and €200. Guests can purchase tickets via the app and receive them as digital entry tickets with a QR code upon payment.
              </p>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <h2 className="text-xl font-semibold mb-3">4. Costs &amp; Fees</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                The use of the "Share Your Party" app is generally free of charge. The platform itself does not charge any additional fees for creating events or purchasing tickets.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Payments within the app are processed via the payment service provider Stripe.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-2">The following applies:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>No additional platform fees are charged to ticket buyers. The displayed ticket price corresponds to the total amount payable unless otherwise stated.</li>
                <li>Organizers (ticket sellers) may incur fees from Stripe. These are deducted directly from earnings.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                The amount of fees depends on Stripe's current terms and may vary depending on the payment method, country, and currency.
              </p>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <h2 className="text-xl font-semibold mb-3">5. Payment Processing</h2>
              <p className="text-muted-foreground leading-relaxed">
                Payments are processed via third-party providers (e.g. Stripe, PayPal). The terms and conditions of these providers also apply. Payment processing is secure and encrypted in accordance with applicable security standards.
              </p>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <h2 className="text-xl font-semibold mb-3">6. Cancellation &amp; Refunds</h2>
              <p className="text-muted-foreground leading-relaxed">
                Refunds are only issued if the event is cancelled by the host. In other cases, there is no automatic right to a refund. Tickets can be cancelled before the event begins, provided the ticket has not yet been scanned.
              </p>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <h2 className="text-xl font-semibold mb-3">7. User Obligations</h2>
              <div className="text-muted-foreground leading-relaxed space-y-3">
                <p>
                  <strong>Hosts</strong> are obliged to provide accurate event information and are responsible for its proper execution. They must comply with all applicable laws and regulations.
                </p>
                <p>
                  <strong>Guests</strong> must behave respectfully during attendance and observe the house rules of the event venue.
                </p>
              </div>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <h2 className="text-xl font-semibold mb-3">8. Code of Conduct</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">All users commit to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Ensuring a safe and respectful environment for everyone</li>
                <li>Zero tolerance for any form of harassment, discrimination or violence</li>
                <li>Compliance with all legal requirements and official regulations</li>
                <li>Responsible handling of alcohol service (observe youth protection laws)</li>
                <li>Transparent communication about event-specific risks</li>
              </ul>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <h2 className="text-xl font-semibold mb-3">9. Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                The app is not liable for the content, execution or safety of events organised by users. Responsibility lies with the respective organiser. Share Your Party merely provides the platform.
              </p>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <h2 className="text-xl font-semibold mb-3">10. Account Suspension</h2>
              <p className="text-muted-foreground leading-relaxed">
                In cases of serious violations of these Terms &amp; Conditions or the Code of Conduct, Share Your Party reserves the right to temporarily or permanently suspend user accounts. Criminal offences will be consistently reported to the authorities.
              </p>
            </section>

            <section className="bg-card rounded-lg p-6 border">
              <h2 className="text-xl font-semibold mb-3">11. Final Provisions</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms &amp; Conditions are governed by the law of the European Union. The place of jurisdiction is the registered office of the app operator in Austria. Should individual provisions of these Terms be invalid, the validity of the remaining provisions shall not be affected.
              </p>
            </section>

          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </button>
        <h1 className="text-3xl font-bold mb-8">Allgemeine Geschäftsbedingungen</h1>
        <div className="space-y-8 text-foreground">
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">1. Geltungsbereich</h2>
            <p className="text-muted-foreground leading-relaxed">
              Diese Allgemeinen Geschäftsbedingungen regeln die Nutzung der mobilen Anwendung und Web-Applikation "Share Your Party", mit der Benutzer eigene Events erstellen, Tickets verkaufen und an Events teilnehmen können. Der Anbieter ist Share Your Party, mit Sitz in Österreich (EU).
            </p>
          </section>
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">2. Benutzerrollen</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">Es gibt zwei Benutzerrollen:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li><strong>Gastgeber (Veranstalter)</strong> - Können Events erstellen und Tickets verkaufen</li>
              <li><strong>Gast (Teilnehmer)</strong> - Können Events besuchen und Tickets kaufen</li>
            </ul>
          </section>
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">3. Buchung &amp; Ticketverkauf</h2>
            <p className="text-muted-foreground leading-relaxed">
              Gastgeber können Events erstellen und Tickets zu frei wählbaren Preisen zwischen 1 EUR und 200 EUR verkaufen. Gäste können Tickets über die App kaufen und erhalten diese nach Zahlungseingang als digitale Eintrittskarten mit QR-Code.
            </p>
          </section>
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">4. Kosten und Gebühren</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">Die Nutzung der App „Share Your Party" ist grundsätzlich kostenlos. Für das Erstellen von Events sowie den Kauf von Tickets erhebt die Plattform selbst keine zusätzlichen Gebühren.</p>
            <p className="text-muted-foreground leading-relaxed mb-3">Zahlungen innerhalb der App werden über den Zahlungsdienstleister Stripe abgewickelt.</p>
            <p className="text-muted-foreground leading-relaxed mb-2">Dabei gilt:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Für Ticketkäufer entstehen keine zusätzlichen Gebühren durch die Plattform. Der angezeigte Ticketpreis entspricht dem zu zahlenden Gesamtbetrag, sofern nicht anders angegeben.</li>
              <li>Für Veranstalter (Verkäufer von Tickets) können Gebühren des Zahlungsdienstleisters Stripe anfallen. Diese werden direkt von den Einnahmen abgezogen.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">Die Höhe der Gebühren richtet sich nach den jeweils aktuellen Konditionen von Stripe und kann je nach Zahlungsmethode, Land und Währung variieren.</p>
          </section>
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">5. Zahlungsabwicklung</h2>
            <p className="text-muted-foreground leading-relaxed">Zahlungen erfolgen über Drittanbieter (z. B. Stripe, PayPal). Es gelten zusätzlich die AGB dieser Anbieter. Die Zahlungsabwicklung erfolgt sicher und verschlüsselt gemäß den geltenden Sicherheitsstandards.</p>
          </section>
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">6. Stornierung &amp; Rückerstattung</h2>
            <p className="text-muted-foreground leading-relaxed">Rückerstattungen erfolgen nur, wenn die Veranstaltung vom Gastgeber abgesagt wird. In anderen Fällen besteht kein automatischer Anspruch auf Rückerstattung. Tickets können vor Eventbeginn storniert werden, sofern das Ticket noch nicht gescannt wurde.</p>
          </section>
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">7. Pflichten der Benutzer</h2>
            <div className="text-muted-foreground leading-relaxed space-y-3">
              <p><strong>Gastgeber</strong> sind verpflichtet, korrekte Informationen zur Veranstaltung bereitzustellen und für deren ordnungsgemäße Durchführung verantwortlich. Sie müssen alle geltenden Gesetze und Vorschriften einhalten.</p>
              <p><strong>Gäste</strong> müssen sich während der Teilnahme respektvoll verhalten und die Hausordnung des Veranstaltungsortes beachten.</p>
            </div>
          </section>
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">8. Verhaltenskodex</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">Alle Benutzer verpflichten sich zu:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Gewährleistung einer sicheren und respektvollen Umgebung für alle</li>
              <li>Null-Toleranz gegenüber jeglicher Form von Belästigung, Diskriminierung oder Gewalt</li>
              <li>Einhaltung aller gesetzlichen Bestimmungen und behördlichen Auflagen</li>
              <li>Verantwortungsvoller Umgang mit Alkoholausschank (Jugendschutz beachten)</li>
              <li>Transparente Kommunikation über eventspezifische Risiken</li>
            </ul>
          </section>
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">9. Haftungsausschluss</h2>
            <p className="text-muted-foreground leading-relaxed">Die App haftet nicht für Inhalte, Durchführung oder Sicherheit von durch Benutzer organisierten Veranstaltungen. Die Verantwortung liegt beim jeweiligen Veranstalter. Share Your Party stellt lediglich die Plattform zur Verfügung.</p>
          </section>
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">10. Kontosperrung</h2>
            <p className="text-muted-foreground leading-relaxed">Bei schwerwiegenden Verstößen gegen diese AGB oder den Verhaltenskodex behält sich Share Your Party das Recht vor, Benutzerkonten vorübergehend oder dauerhaft zu sperren. Straftaten werden konsequent zur Anzeige gebracht.</p>
          </section>
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-3">11. Schlussbestimmungen</h2>
            <p className="text-muted-foreground leading-relaxed">Diese Allgemeinen Geschäftsbedingungen unterliegen dem Recht der Europäischen Union. Gerichtsstand ist der Sitz des Betreibers der App in Österreich. Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen davon unberührt.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
