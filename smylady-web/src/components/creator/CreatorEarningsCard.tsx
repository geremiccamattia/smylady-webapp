'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLocalePath } from '@/hooks/useLocalePath'
import { computeCreatorEarnings } from '@/lib/creatorEarnings'
import { formatDate, formatMonth, formatPrice } from '@/lib/utils'
import type { CreatorAssignment } from '@/services/creator'

/**
 * Einnahmen des Creators: Summen oben, darunter eine Zeile pro Monat. Ein
 * Monat klappt auf und zeigt die Aufträge, aus denen sich die Summe ergibt.
 *
 * Die Regeln, was zählt, stehen in computeCreatorEarnings.
 */
export function CreatorEarningsCard({ assignments }: { assignments: CreatorAssignment[] }) {
  const { t } = useTranslation()
  const localePath = useLocalePath()
  const earnings = useMemo(() => computeCreatorEarnings(assignments), [assignments])

  // Breite der Balken relativ zum stärksten Monat.
  const maxMonthTotal = Math.max(0, ...earnings.months.map((month) => month.total))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          {t('creatorDashboard.earningsTitle', { defaultValue: 'Einnahmen' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat
            label={t('creatorDashboard.earningsTotal', { defaultValue: 'Verdient gesamt' })}
            value={formatPrice(earnings.totalEarned)}
          />
          <Stat
            label={t('creatorDashboard.earningsThisMonth', { defaultValue: 'Dieser Monat' })}
            value={formatPrice(earnings.currentMonthTotal)}
          />
          <Stat
            label={t('creatorDashboard.earningsUpcoming', { defaultValue: 'Erwartet' })}
            value={formatPrice(earnings.totalUpcoming)}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {t('creatorDashboard.earningsHint', {
            defaultValue:
              'Gezählt werden alle Aufträge, die du angenommen hast, im Monat des Events. Verdient heisst: Das Event liegt hinter dir. Erwartet heisst: Es steht noch bevor.',
          })}
        </p>

        {earnings.months.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('creatorDashboard.earningsEmpty', {
              defaultValue: 'Noch keine Einnahmen. Sobald du einen Auftrag annimmst, erscheint er hier.',
            })}
          </p>
        ) : (
          <div>
            <h3 className="text-sm font-medium mb-2">
              {t('creatorDashboard.earningsByMonth', { defaultValue: 'Monatsübersicht' })}
            </h3>
            <ul className="divide-y rounded-md border">
              {earnings.months.map((month) => (
                <li key={month.key || 'undated'}>
                  <details className="group">
                    <summary className="flex items-center gap-3 p-3 cursor-pointer list-none hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform -rotate-90 group-open:rotate-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-medium truncate">
                            {month.monthStart
                              ? formatMonth(month.monthStart)
                              : t('creatorDashboard.earningsUndated', { defaultValue: 'Ohne Datum' })}
                          </span>
                          <span className="font-semibold tabular-nums shrink-0">{formatPrice(month.total)}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: maxMonthTotal > 0 ? `${(month.total / maxMonthTotal) * 100}%` : '0%' }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3">
                          <span>
                            {t('creatorDashboard.earningsCount', {
                              count: month.entries.length,
                              defaultValue_one: '1 Auftrag',
                              defaultValue_other: '{{count}} Aufträge',
                              defaultValue: '{{count}} Aufträge',
                            })}
                          </span>
                          {month.upcoming > 0 && month.earned > 0 && (
                            <span>
                              {t('creatorDashboard.earningsSplit', {
                                earned: formatPrice(month.earned),
                                upcoming: formatPrice(month.upcoming),
                                defaultValue: '{{earned}} verdient · {{upcoming}} erwartet',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </summary>
                    <ul className="border-t bg-muted/20">
                      {month.entries.map((entry) => (
                        <li key={entry.assignment.id}>
                          <Link
                            href={localePath(`/creator/assignments/${entry.assignment.id}`)}
                            className="flex items-center gap-3 px-3 py-2 pl-10 text-sm hover:bg-muted/50"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="truncate">
                                {entry.assignment.eventName ||
                                  t('creatorDashboard.assignmentUnnamed', { defaultValue: 'Auftrag' })}
                              </div>
                              {entry.date && (
                                <div className="text-xs text-muted-foreground">{formatDate(entry.date)}</div>
                              )}
                            </div>
                            {!entry.earned && (
                              <Badge variant="outline" className="font-normal shrink-0">
                                {t('creatorDashboard.earningsUpcomingBadge', { defaultValue: 'erwartet' })}
                              </Badge>
                            )}
                            <span className="tabular-nums shrink-0">{formatPrice(entry.amount)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
    </div>
  )
}
