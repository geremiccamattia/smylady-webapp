'use client'

import { ArrowLeft, Mail, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

export default function Impressum() {
  const email = 'office@shareyourparty.de'
  const router = useRouter()
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')

  const back = isEnglish ? 'Back' : 'Zurück'

  return (
    <div>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {back}
        </button>

        <h1 className="text-3xl font-bold mb-8">
          {isEnglish ? 'Legal Notice' : 'Impressum'}
        </h1>

        <div className="space-y-8">
          {/* Company Info */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-4">
              {isEnglish ? 'Company Information' : 'Angaben gemäß § 5 TMG'}
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="font-medium text-foreground">Share Your Party</p>
              <p>Sherin Strobl & Mattia Geremicca</p>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Polgarstraße 13E/ 13, 1220 Wien, Austria</span>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-4">
              {isEnglish ? 'Contact' : 'Kontakt'}
            </h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <a href={`mailto:${email}`} className="text-primary hover:underline">
                {email}
              </a>
            </div>
          </section>

          {/* Responsible for Content */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-4">
              {isEnglish ? 'Responsible for Content' : 'Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV'}
            </h2>
            <div className="text-muted-foreground">
              <p>Sherin Strobl & Mattia Geremicca</p>
              <p>Share Your Party</p>
            </div>
          </section>

          {/* Dispute Resolution */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-4">
              {isEnglish ? 'Dispute Resolution' : 'Streitschlichtung'}
            </h2>
            {isEnglish ? (
              <>
                <p className="text-muted-foreground leading-relaxed">
                  The European Commission provides a platform for online dispute resolution (ODR):
                  <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                    https://ec.europa.eu/consumers/odr/
                  </a>
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  We are not willing or obliged to participate in dispute resolution proceedings before a
                  consumer arbitration board.
                </p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground leading-relaxed">
                  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
                  <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                    https://ec.europa.eu/consumers/odr/
                  </a>
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                  Verbraucherschlichtungsstelle teilzunehmen.
                </p>
              </>
            )}
          </section>

          {/* Liability for Content */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-4">
              {isEnglish ? 'Liability for Content' : 'Haftung für Inhalte'}
            </h2>
            {isEnglish ? (
              <>
                <p className="text-muted-foreground leading-relaxed">
                  As a service provider, we are responsible for our own content on these pages in accordance
                  with general law. However, we are not obligated to monitor transmitted or stored third-party
                  information or to investigate circumstances that indicate illegal activity.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Obligations to remove or block the use of information under general law remain unaffected.
                  Liability in this regard is only possible from the time of knowledge of a specific
                  infringement. Upon becoming aware of such violations, we will remove this content immediately.
                </p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground leading-relaxed">
                  Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach
                  den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter
                  jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen
                  oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen
                  Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt
                  der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden
                  Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
                </p>
              </>
            )}
          </section>

          {/* Liability for Links */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-4">
              {isEnglish ? 'Liability for Links' : 'Haftung für Links'}
            </h2>
            {isEnglish ? (
              <>
                <p className="text-muted-foreground leading-relaxed">
                  Our website contains links to external third-party websites over whose content we have no
                  influence. Therefore, we cannot accept any liability for this third-party content. The
                  respective provider or operator of the linked pages is always responsible for their content.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  The linked pages were checked for possible legal violations at the time of linking. No illegal
                  content was identified at the time of linking. Permanent monitoring of linked pages is not
                  reasonable without concrete evidence of a legal violation. Upon becoming aware of violations,
                  we will remove such links immediately.
                </p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground leading-relaxed">
                  Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss
                  haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte
                  der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft.
                  Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente
                  inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer
                  Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige
                  Links umgehend entfernen.
                </p>
              </>
            )}
          </section>

          {/* Copyright */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-4">
              {isEnglish ? 'Copyright' : 'Urheberrecht'}
            </h2>
            {isEnglish ? (
              <>
                <p className="text-muted-foreground leading-relaxed">
                  The content and works on these pages created by the site operators are subject to copyright law.
                  Reproduction, editing, distribution and any kind of use outside the limits of copyright law
                  require the written consent of the respective author or creator. Downloads and copies of this
                  site are only permitted for private, non-commercial use.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Where content on this site was not created by the operator, the copyrights of third parties are
                  respected. Third-party content is identified as such. Should you become aware of a copyright
                  infringement, please notify us accordingly. Upon becoming aware of violations, we will remove
                  such content immediately.
                </p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground leading-relaxed">
                  Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
                  deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
                  Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
                  jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten,
                  nicht kommerziellen Gebrauch gestattet.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte
                  Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie
                  trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden
                  Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
                </p>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
