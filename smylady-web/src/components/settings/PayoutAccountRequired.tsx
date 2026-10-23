'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { CreditCard } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLocalePath } from '@/hooks/useLocalePath'

/**
 * Hinweis „Erst das Auszahlungskonto verbinden" mit dem Weg in die
 * Einstellungen (/settings#payout, dort springt die Stripe-Karte an).
 *
 * Brand: vor dem Anlegen eines Auftrags (Ticketerlöse aus ihren Events).
 * Creator: vor der Zusage (Vergütung nach dem Event). Das Backend lehnt
 * beides ohne aktives Konto ab; diese Karte sagt es vorher.
 */
export function PayoutAccountRequired({ role }: { role: 'brand' | 'creator' }) {
  const { t } = useTranslation()
  const localePath = useLocalePath()

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardContent className="p-4 text-sm flex items-center gap-3 flex-wrap">
        <CreditCard className="h-5 w-5 text-orange-700 shrink-0" />
        <div className="flex-1 min-w-[12rem]">
          <div className="font-medium">
            {t('payoutAccount.title', { defaultValue: 'Erst Auszahlungskonto bei Stripe verbinden' })}
          </div>
          <p className="text-muted-foreground">
            {role === 'brand'
              ? t('payoutAccount.brandDesc', {
                  defaultValue:
                    'Bevor du einen Auftrag anlegen kannst, verbinde dein Stripe-Konto. Darüber laufen die Ticketerlöse aus deinen Events. Die Einrichtung dauert ein paar Minuten.',
                })
              : t('payoutAccount.creatorDesc', {
                  defaultValue:
                    'Bevor du zusagen kannst, verbinde dein Stripe-Konto. Darüber zahlen wir dir die Vergütung nach dem Event aus. Die Einrichtung dauert ein paar Minuten.',
                })}
          </p>
        </div>
        <Link href={localePath('/settings#payout')}>
          <Button size="sm" variant="gradient">
            {t('payoutAccount.connect', { defaultValue: 'Auszahlungskonto verbinden' })}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
