'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Loader2, TicketPercent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { PROMO_CODE_QUERY_KEY, PROMO_LIMITS, promoService, readPromoError, type PromoCode } from '@/services/promo'

/**
 * „Rabattcode für deine Events“ im Profil: ein Code für alle eigenen Events.
 * Wer den QR-Code auf dem Event scannt, sieht ihn ohne Anmeldung. Eigenes
 * Speichern (PUT /promo/me), unabhängig vom Profilformular.
 */
export function PromoCodeCard() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const query = useQuery<PromoCode>({
    queryKey: PROMO_CODE_QUERY_KEY,
    queryFn: () => promoService.getMyPromoCode(),
    retry: false,
  })
  const [form, setForm] = useState<PromoCode>({ promoCode: '', promoText: '' })

  useEffect(() => {
    if (query.data) setForm(query.data)
  }, [query.data])

  const save = useMutation({
    mutationFn: () => promoService.updateMyPromoCode(form),
    onSuccess: (saved) => {
      queryClient.setQueryData(PROMO_CODE_QUERY_KEY, saved)
      queryClient.invalidateQueries({ queryKey: ['promo', 'event'] })
      toast({
        title: saved.promoCode
          ? t('promo.saved', { defaultValue: 'Dein Rabattcode wurde gespeichert.' })
          : t('promo.removed', { defaultValue: 'Dein Rabattcode wurde entfernt.' }),
      })
    },
    onError: (error) =>
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description: readPromoError(
          error,
          t('promo.saveFailed', { defaultValue: 'Der Rabattcode konnte nicht gespeichert werden.' }),
        ),
      }),
  })

  const unchanged =
    query.data?.promoCode === form.promoCode.trim() && query.data?.promoText === form.promoText.trim()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TicketPercent className="h-5 w-5 text-primary" />
          {t('promo.cardTitle', { defaultValue: 'Rabattcode für deine Events' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('promo.cardDesc', {
            defaultValue:
              'Gäste sehen diesen Code, wenn sie den QR-Code auf deinem Event scannen – ohne Anmeldung. Ohne Rabattcode führt der QR-Code zur Eventseite.',
          })}
        </p>
        {query.isError ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">
              {t('promo.loadFailed', { defaultValue: 'Der Rabattcode lässt sich gerade nicht laden.' })}
            </p>
            <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
              {t('promo.retry', { defaultValue: 'Erneut versuchen' })}
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              save.mutate()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="promoCode">{t('promo.codeLabel', { defaultValue: 'Rabattcode' })}</Label>
              <Input
                id="promoCode"
                value={form.promoCode}
                maxLength={PROMO_LIMITS.promoCode}
                autoComplete="off"
                placeholder={t('promo.codePlaceholder', { defaultValue: 'z. B. PARTY10' })}
                disabled={query.isLoading || save.isPending}
                onChange={(e) => setForm({ ...form, promoCode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promoText">{t('promo.textLabel', { defaultValue: 'Hinweis (optional)' })}</Label>
              <Textarea
                id="promoText"
                rows={2}
                value={form.promoText}
                maxLength={PROMO_LIMITS.promoText}
                placeholder={t('promo.textPlaceholder', {
                  defaultValue: 'z. B. 10 % auf alle Getränke an der Bar',
                })}
                disabled={query.isLoading || save.isPending || !form.promoCode.trim()}
                onChange={(e) => setForm({ ...form, promoText: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={query.isLoading || save.isPending || unchanged}>
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('promo.save', { defaultValue: 'Rabattcode speichern' })}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
