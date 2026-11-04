'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CalendarPlus, FileText, Loader2, Megaphone } from 'lucide-react'
import CreateEvent from '@/views/CreateEvent'
import BulkUpload from '@/views/BulkUpload'
import { Button } from '@/components/ui/button'
import { useBrandProfile } from '@/hooks/useBrandProfile'
import { useLocalePath } from '@/hooks/useLocalePath'
import { brandService, canCreateCreatorEvent, type BrandOrder } from '@/services/brand'

type Choice = null | 'single' | 'bulk' | 'creator'

/**
 * /create-event: erst die Wahl, dann das Formular.
 *
 * - Einzelnes Event, mehrere per CSV — wie bisher.
 * - Creator-Event: das Event zu einem Brand-Auftrag. Dasselbe Formular wie
 *   ein einzelnes Event, verknüpft mit dem gewählten Auftrag und mit seinen
 *   Eckdaten vorbefüllt. Nur für den Inhaber einer Brand (das Event gehört
 *   ihm). Direkt aus dem Auftrag kommt man mit ?brandOrder=<id>.
 */
function CreateEventChooserContent() {
  const { t } = useTranslation()
  const localePath = useLocalePath()
  const searchParams = useSearchParams()
  const orderFromUrl = searchParams.get('brandOrder')
  const [choice, setChoice] = useState<Choice>(orderFromUrl ? 'creator' : null)
  const [orderId, setOrderId] = useState<string | null>(orderFromUrl)
  const { standing, role } = useBrandProfile()
  const isBrand = standing === 'active' || standing === 'pending'
  const isBrandOwner = isBrand && role === 'owner'

  const ordersQuery = useQuery<BrandOrder[]>({
    queryKey: ['brand', 'orders'],
    queryFn: () => brandService.getMyOrders(),
    enabled: choice === 'creator' && isBrandOwner,
  })

  const orderQuery = useQuery<BrandOrder>({
    queryKey: ['brand', 'order', orderId],
    queryFn: () => brandService.getMyOrder(orderId as string),
    enabled: choice === 'creator' && Boolean(orderId),
  })

  if (choice === 'bulk') {
    return <BulkUpload onBack={() => setChoice(null)} />
  }
  if (choice === 'single') {
    return <CreateEvent />
  }

  if (choice === 'creator' && orderId) {
    if (orderQuery.isLoading) {
      return (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )
    }
    const order = orderQuery.data
    if (!order || !canCreateCreatorEvent(order)) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
          <h1 className="text-2xl font-bold">{t('creatorEvent.title', { defaultValue: 'Creator-Event anlegen' })}</h1>
          <p className="text-muted-foreground">
            {order?.eventId
              ? t('creatorEvent.alreadyCreated', {
                  defaultValue: 'Zu diesem Auftrag gibt es schon ein Event. Du kannst es im Auftrag öffnen und bearbeiten.',
                })
              : t('creatorEvent.notPossible', {
                  defaultValue: 'Zu diesem Auftrag lässt sich kein Event (mehr) anlegen.',
                })}
          </p>
          {order && (
            <Link href={localePath(`/brand/orders/${order.id}`)}>
              <Button variant="outline">{t('creatorEvent.toOrder', { defaultValue: 'Zum Auftrag' })}</Button>
            </Link>
          )}
        </div>
      )
    }
    return <CreateEvent brandOrder={order} />
  }

  if (choice === 'creator') {
    const orders = (ordersQuery.data ?? []).filter(canCreateCreatorEvent)
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <button
          type="button"
          onClick={() => setChoice(null)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back', { defaultValue: 'Zurück' })}
        </button>
        <div>
          <h1 className="text-2xl font-bold">{t('creatorEvent.title', { defaultValue: 'Creator-Event anlegen' })}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('creatorEvent.pickOrder', {
              defaultValue: 'Zu welchem Brand-Auftrag gehört das Event? Die Eckdaten aus dem Auftrag sind im Formular schon eingetragen.',
            })}
          </p>
        </div>
        {!isBrandOwner ? (
          <p className="text-sm text-muted-foreground">
            {t('creatorEvent.ownerOnly', {
              defaultValue: 'Creator-Events legt der Inhaber einer Brand zu einem Brand-Auftrag an.',
            })}
          </p>
        ) : ordersQuery.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : orders.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('creatorEvent.noOrders', {
                defaultValue: 'Kein offener Brand-Auftrag ohne Event. Lege zuerst einen Auftrag an.',
              })}
            </p>
            <Link href={localePath('/brand/orders/new')}>
              <Button variant="outline">{t('creatorEvent.newOrder', { defaultValue: 'Neuer Auftrag' })}</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => setOrderId(order.id)}
                className="w-full p-4 border rounded-xl text-left hover:border-primary hover:bg-accent transition-colors"
              >
                <p className="font-semibold">{order.title}</p>
                <p className="text-sm text-muted-foreground">
                  {[order.eventName, order.eventDate ? new Date(order.eventDate).toLocaleDateString('de-AT', { timeZone: 'Europe/Vienna' }) : '', order.eventLocation]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('events.createEvent', { defaultValue: 'Event erstellen' })}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('creatorEvent.chooseHow', { defaultValue: 'Wie möchtest du Events hinzufügen?' })}
        </p>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${isBrand ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <ChoiceCard
          icon={<CalendarPlus className="h-5 w-5 text-primary" />}
          title={t('creatorEvent.single', { defaultValue: 'Einzelnes Event' })}
          text={t('creatorEvent.singleDesc', { defaultValue: 'Schritt für Schritt durch das Formular' })}
          onClick={() => setChoice('single')}
        />
        <ChoiceCard
          icon={<FileText className="h-5 w-5 text-primary" />}
          title={t('creatorEvent.bulk', { defaultValue: 'Mehrere Events per CSV' })}
          text={t('creatorEvent.bulkDesc', { defaultValue: 'Ideal für Veranstalter mit vielen Events' })}
          onClick={() => setChoice('bulk')}
        />
        {isBrand && (
          <ChoiceCard
            icon={<Megaphone className="h-5 w-5 text-primary" />}
            title={t('creatorEvent.choice', { defaultValue: 'Creator-Event' })}
            text={t('creatorEvent.choiceDesc', { defaultValue: 'Das Event zu deinem Brand-Auftrag mit Creatorn' })}
            onClick={() => setChoice('creator')}
          />
        )}
      </div>
    </div>
  )
}

function ChoiceCard({ icon, title, text, onClick }: { icon: React.ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-6 border rounded-xl text-left hover:border-primary hover:bg-accent transition-colors space-y-3"
    >
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">{icon}</div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{text}</p>
      </div>
    </button>
  )
}

export default function CreateEventChooser() {
  return (
    <Suspense>
      <CreateEventChooserContent />
    </Suspense>
  )
}
