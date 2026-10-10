'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Building2, CalendarDays, ChevronRight, Pencil, Plus, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useLocalePath } from '@/hooks/useLocalePath'
import { useBrandProfile } from '@/hooks/useBrandProfile'
import { brandService, type BrandOrder } from '@/services/brand'
import { formatDate, formatPrice, resolveImageUrl } from '@/lib/utils'
import { BrandGate, LoadingBars, OrderStatusBadge, ProfileStatusBadge } from '@/components/brand/brandShared'

export const BRAND_ORDERS_QUERY_KEY = ['brand', 'orders'] as const

/**
 * Startseite des Brand-Bereichs: eigenes Profil und alle Aufträge.
 *
 * Die Zugangsprüfung übernimmt BrandGate — hier kommt nur eine aktive Brand
 * an. Die Auftragsliste hängt zusätzlich an `enabled`, damit sie nicht vor der
 * Prüfung in einen 403 läuft.
 */
export default function BrandDashboard() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BrandGate>
        <DashboardContent />
      </BrandGate>
    </div>
  )
}

function DashboardContent() {
  const { t } = useTranslation()
  const localePath = useLocalePath()
  const { user } = useAuth()
  const { profile, standing } = useBrandProfile()

  const ordersQuery = useQuery<BrandOrder[]>({
    queryKey: BRAND_ORDERS_QUERY_KEY,
    queryFn: () => brandService.getMyOrders(),
    enabled: Boolean(user) && standing === 'active',
    retry: false,
  })

  if (!profile) return null

  const orders = ordersQuery.data ?? []
  const needsAttention = orders.filter((order) => order.status === 'offer_sent')

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('brandDashboard.title', { defaultValue: 'Brand-Dashboard' })}</h1>
          <p className="text-muted-foreground">
            {t('brandDashboard.subtitle', { defaultValue: 'Deine Aufträge an Creator auf einen Blick.' })}
          </p>
        </div>
        <Link href={localePath('/brand/orders/new')}>
          <Button variant="gradient" className="gap-2">
            <Plus className="h-4 w-4" />
            {t('brandDashboard.newOrder', { defaultValue: 'Neuer Auftrag' })}
          </Button>
        </Link>
      </div>

      {/* Profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('brandDashboard.profileTitle', { defaultValue: 'Dein Unternehmen' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {profile.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveImageUrl(profile.logoUrl)}
                alt=""
                className="h-14 w-14 rounded-lg object-cover bg-muted shrink-0"
              />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-lg truncate">{profile.companyName}</span>
                <ProfileStatusBadge status={profile.status} />
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {[profile.industry, profile.contactName].filter(Boolean).join(' · ')}
              </div>
            </div>
            <Link href={localePath('/brand/profile')}>
              <Button variant="outline" size="sm" className="gap-2">
                <Pencil className="h-4 w-4" />
                {t('brandDashboard.editProfile', { defaultValue: 'Profil bearbeiten' })}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Hinweis auf offene Angebote. Bei genau einem Auftrag ist die ganze
          Karte der Link dorthin, bei mehreren folgt die Liste der Aufträge. */}
      {needsAttention.length === 1 && (
        <Link href={localePath(`/brand/orders/${needsAttention[0].id}`)} className="block">
          <Card className="border-purple-200 bg-purple-50/50 hover:bg-purple-50 transition-colors">
            <CardContent className="p-4 text-sm flex items-center gap-3">
              <span className="flex-1">
                {t('brandDashboard.offerHint', {
                  count: 1,
                  defaultValue: 'Für einen Auftrag liegt ein Angebot vor. Sieh es dir an und bestätige es.',
                })}{' '}
                <span className="font-medium">{needsAttention[0].title}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>
      )}
      {needsAttention.length > 1 && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4 text-sm space-y-2">
            <p>
              {t('brandDashboard.offerHint', {
                count: needsAttention.length,
                defaultValue: 'Für {{count}} Aufträge liegen Angebote vor. Sieh sie dir an und bestätige sie.',
              })}
            </p>
            <ul className="space-y-1">
              {needsAttention.map((order) => (
                <li key={order.id}>
                  <Link
                    href={localePath(`/brand/orders/${order.id}`)}
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    {order.title}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Aufträge */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {t('brandDashboard.ordersTitle', { defaultValue: 'Aufträge' })}
            {orders.length > 0 && <span className="text-muted-foreground font-normal">({orders.length})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordersQuery.isLoading ? (
            <LoadingBars />
          ) : ordersQuery.isError ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                {t('brandDashboard.ordersLoadFailed', {
                  defaultValue: 'Deine Aufträge lassen sich gerade nicht laden.',
                })}
              </p>
              <Button variant="outline" onClick={() => ordersQuery.refetch()}>
                {t('common.retry', { defaultValue: 'Erneut versuchen' })}
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                {t('brandDashboard.ordersEmpty', {
                  defaultValue: 'Noch keine Aufträge. Beschreibe dein Event und was du dir von Creatorn wünschst.',
                })}
              </p>
              <Link href={localePath('/brand/orders/new')}>
                <Button variant="gradient" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('brandDashboard.firstOrder', { defaultValue: 'Ersten Auftrag anlegen' })}
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={localePath(`/brand/orders/${order.id}`)}
                    className="flex items-center gap-4 py-4 hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{order.title}</span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span className="truncate">
                          {order.eventName}
                          {order.eventDate ? ` · ${formatDate(order.eventDate)}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm shrink-0">
                      {order.offerPrice !== null ? (
                        <>
                          <div className="font-medium">{formatPrice(order.offerPrice)}</div>
                          <div className="text-xs text-muted-foreground">
                            {t('brandDashboard.offerLabel', { defaultValue: 'Angebot' })}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-medium">{formatPrice(order.budget)}</div>
                          <div className="text-xs text-muted-foreground">
                            {t('brandDashboard.budgetLabel', { defaultValue: 'Budget' })}
                          </div>
                        </>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  )
}
