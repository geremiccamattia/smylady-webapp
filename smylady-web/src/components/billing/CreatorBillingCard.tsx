'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { LoadingBars } from '@/components/brand/brandShared'
import { readCreatorError } from '@/services/creator'
import { billingService, type CreatorBillingState } from '@/services/billing'
import {
  CreatorBillingFields,
  billingFormFromBilling,
  toBillingPayload,
  useBillingFieldLabel,
  useBillingValidation,
  type BillingFormValues,
} from './CreatorBillingFields'

export const CREATOR_BILLING_QUERY_KEY = ['creator', 'billing'] as const

/** Anker der Karte im Creator-Profil; die Hinweise an wartenden Auszahlungsbelegen verlinken darauf. */
export const CREATOR_BILLING_ANCHOR = 'billing'

/**
 * Abrechnungsdaten im Creator-Profil (/creator/profile#billing).
 *
 * Eigenes Formular mit eigenem Speichern-Knopf: Die Daten gehen an
 * PUT /creators/me/billing, nicht mit dem Profil an PATCH /creators/me.
 * Nach dem Speichern stellt das Backend wartende Auszahlungsbelege aus — deshalb
 * werden die Beleg-Listen danach neu geladen.
 */
export function CreatorBillingCard() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const validate = useBillingValidation()
  const fieldLabel = useBillingFieldLabel()
  const cardRef = useRef<HTMLDivElement>(null)
  const [form, setForm] = useState<BillingFormValues | null>(null)

  const query = useQuery<CreatorBillingState>({
    queryKey: CREATOR_BILLING_QUERY_KEY,
    queryFn: () => billingService.getCreatorBilling(),
    retry: false,
  })

  // Einmal mit dem Serverstand füllen; danach gehört das Formular dem Nutzer.
  useEffect(() => {
    if (query.data && form === null) setForm(billingFormFromBilling(query.data.billing))
  }, [query.data, form])

  // Aus dem Hinweis an einem Auszahlungsbeleg kommend (#billing): hinscrollen,
  // sobald die Karte steht — der Browser springt vor dem Laden ins Leere.
  const ready = form !== null
  useEffect(() => {
    if (ready && typeof window !== 'undefined' && window.location.hash === `#${CREATOR_BILLING_ANCHOR}`) {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [ready])

  const save = useMutation({
    mutationFn: (values: BillingFormValues) => billingService.saveCreatorBilling(toBillingPayload(values)),
    onSuccess: (state) => {
      queryClient.setQueryData(CREATOR_BILLING_QUERY_KEY, state)
      setForm(billingFormFromBilling(state.billing))
      // Wartende Auszahlungsbelege sind jetzt womöglich ausgestellt.
      queryClient.invalidateQueries({ queryKey: ['creator', 'billing-documents'] })
      toast({
        title: t('common.success', { defaultValue: 'Erfolg' }),
        description: t('billing.saved', { defaultValue: 'Deine Abrechnungsdaten wurden gespeichert.' }),
      })
    },
    onError: (error: unknown) =>
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description: readCreatorError(error, t('billing.saveFailed', { defaultValue: 'Die Abrechnungsdaten konnten nicht gespeichert werden.' })),
      }),
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form) return
    const problem = validate(form)
    if (problem) {
      toast({ variant: 'destructive', title: t('common.error', { defaultValue: 'Fehler' }), description: problem })
      return
    }
    save.mutate(form)
  }

  const state = query.data

  return (
    <Card id={CREATOR_BILLING_ANCHOR} ref={cardRef} className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-5 w-5" />
          {t('billing.sectionTitle', { defaultValue: 'Abrechnungsdaten' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('billing.sectionDesc', {
            defaultValue:
              'Mit jeder Auszahlung schicken wir dir einen Auszahlungsbeleg über den ausgezahlten Betrag. Dafür brauchen wir deinen Namen und deine Anschrift. Diese Angaben sehen nur du und wir.',
          })}
        </p>

        {query.isLoading && <LoadingBars />}

        {query.isError && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <span>{t('billing.loadFailed', { defaultValue: 'Die Abrechnungsdaten lassen sich gerade nicht laden.' })}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
              {t('common.retry', { defaultValue: 'Erneut versuchen' })}
            </Button>
          </div>
        )}

        {state && (
          state.complete ? (
            <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50/60 p-3 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              {t('billing.complete', { defaultValue: 'Deine Abrechnungsdaten sind vollständig.' })}
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50/60 p-3 text-sm text-yellow-900">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                {t('billing.incomplete', {
                  defaultValue: 'Deine Abrechnungsdaten fehlen noch. Ohne sie können wir keinen Auszahlungsbeleg ausstellen.',
                })}
                {state.billing && state.missing.length > 0 && (
                  <>
                    {' '}
                    {t('billing.missingFields', {
                      fields: state.missing.map(fieldLabel).join(', '),
                      defaultValue: 'Es fehlt: {{fields}}.',
                    })}
                  </>
                )}
              </span>
            </div>
          )
        )}

        {form && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <CreatorBillingFields value={form} onChange={setForm} idPrefix="profile-billing" disabled={save.isPending} />
            <div className="flex justify-end">
              <Button type="submit" variant="gradient" loading={save.isPending}>
                {t('billing.save', { defaultValue: 'Abrechnungsdaten speichern' })}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
