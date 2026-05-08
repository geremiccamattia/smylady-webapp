import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function Pricing() {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = 'Preise & Konditionen | Share Your Party'
  }, [])

  return (
    <div className="container max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">
        {t('pricing.title', { defaultValue: 'Preise & Konditionen' })}
      </h1>
      <p className="text-muted-foreground mb-10">
        {t('pricing.subtitle', { defaultValue: 'Transparente Gebühren für Veranstalter und Gäste auf Share Your Party.' })}
      </p>

      {/* Kostenlose Events */}
      <div className="p-6 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800 mb-8">
        <h2 className="text-xl font-semibold text-green-700 dark:text-green-400 mb-2">
          {t('pricing.freeEvents', { defaultValue: 'Kostenlose Events' })}
        </h2>
        <p className="text-green-700 dark:text-green-300 text-sm">
          {t('pricing.freeEventsDesc', { defaultValue: 'Für kostenlose Events erheben wir keinerlei Gebühren – weder für Veranstalter noch für Gäste. Die Nutzung von Share Your Party für kostenlose Events ist vollständig gratis.' })}
        </p>
      </div>

      {/* Veranstalter */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {t('pricing.organizerFees', { defaultValue: 'Gebühren für Veranstalter' })}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t('pricing.organizerFeesDesc', { defaultValue: 'Die Veranstaltergebühr wird automatisch vom Ticketerlös abgezogen und an Share Your Party weitergeleitet.' })}
        </p>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">{t('pricing.ticketPrice', { defaultValue: 'Ticketpreis' })}</th>
                <th className="text-right px-4 py-3 font-semibold">{t('pricing.fee', { defaultValue: 'Gebühr' })}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-4 py-3">{t('pricing.upTo50', { defaultValue: '€1,00 – €50,00' })}</td>
                <td className="px-4 py-3 text-right font-medium">4%</td>
              </tr>
              <tr className="border-t bg-muted/20">
                <td className="px-4 py-3">{t('pricing.over50', { defaultValue: 'Über €50,00' })}</td>
                <td className="px-4 py-3 text-right font-medium">5%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Gäste */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {t('pricing.guestFees', { defaultValue: 'Gebühren für Gäste' })}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t('pricing.guestFeesDesc', { defaultValue: 'Die Gästegebühr wird beim Ticketkauf zum Ticketpreis hinzugerechnet und transparently ausgewiesen.' })}
        </p>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">{t('pricing.ticketPrice', { defaultValue: 'Ticketpreis' })}</th>
                <th className="text-right px-4 py-3 font-semibold">{t('pricing.fee', { defaultValue: 'Gebühr' })}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-4 py-3">{t('pricing.upTo50', { defaultValue: '€1,00 – €50,00' })}</td>
                <td className="px-4 py-3 text-right font-medium">3%</td>
              </tr>
              <tr className="border-t bg-muted/20">
                <td className="px-4 py-3">{t('pricing.over50', { defaultValue: 'Über €50,00' })}</td>
                <td className="px-4 py-3 text-right font-medium">4%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Beispielrechnung */}
      <div className="p-6 bg-muted/40 rounded-xl border mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {t('pricing.example', { defaultValue: 'Beispielrechnung' })}
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          {t('pricing.exampleDesc', { defaultValue: 'Ein Ticket kostet €20,00:' })}
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('pricing.ticketPrice', { defaultValue: 'Ticketpreis' })}</span>
            <span>€20,00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('pricing.guestFeeLabel', { defaultValue: 'Gästegebühr (3%)' })}</span>
            <span>+ €0,60</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-2 mt-2">
            <span>{t('pricing.guestTotal', { defaultValue: 'Gast zahlt insgesamt' })}</span>
            <span>€20,60</span>
          </div>
          <div className="flex justify-between text-muted-foreground border-t pt-2 mt-2">
            <span>{t('pricing.organizerFeeLabel', { defaultValue: 'Veranstaltergebühr (4%)' })}</span>
            <span>– €0,80</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>{t('pricing.organizerReceives', { defaultValue: 'Veranstalter erhält' })}</span>
            <span>€19,20</span>
          </div>
          <div className="flex justify-between text-primary font-semibold">
            <span>{t('pricing.sypReceives', { defaultValue: 'Share Your Party erhält' })}</span>
            <span>€1,40</span>
          </div>
        </div>
      </div>

      {/* Boost */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">
          {t('pricing.boost', { defaultValue: 'Event Boost' })}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('pricing.boostDesc', { defaultValue: 'Das Boosten von Events ist ein optionales bezahltes Feature. Veranstalter wählen Budget, Laufzeit und Umkreis selbst. Das Mindestbudget beträgt €5. Weitere Details zum Boost-Feature findest du beim Erstellen oder Bearbeiten deines Events.' })}
        </p>
      </div>

      <div className="border-t pt-6 text-sm text-muted-foreground">
        <p>
          {t('pricing.questions', { defaultValue: 'Bei Fragen zu unseren Preisen und Konditionen wende dich an' })}{' '}
          <a href="mailto:office@shareyourparty.de" className="text-primary hover:underline">
            office@shareyourparty.de
          </a>
          {'. '}
          {t('pricing.termsNote', { defaultValue: 'Weitere Informationen findest du in unseren' })}{' '}
          <Link to="/terms" className="text-primary hover:underline">
            {t('legal.terms')}
          </Link>.
        </p>
      </div>
    </div>
  )
}
