import { useState, useMemo } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronLeft,
  Search,
  RefreshCw,
  Ticket,
  CheckCircle,
  Clock,
  QrCode,
  User,
  ScanLine,
} from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ticketsService } from '@/services/tickets'

interface ScanItem {
  ticketId: string
  userName: string
  userEmail?: string
  profileImage?: string | null
  scannedAt?: string
  status: 'scanned' | 'pending'
}

type TabType = 'all' | 'scanned' | 'pending'

export default function ScanStatistics() {
  const { t } = useTranslation()
  const { eventId } = useParams<{ eventId: string }>()
  const [searchParams] = useSearchParams()
  const eventName = searchParams.get('name') || ''

  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['scanStatistics', eventId],
    queryFn: () => ticketsService.getScanStatistics(eventId!),
    enabled: !!eventId,
    refetchInterval: 30000,
    staleTime: 30000,
  })

  // Filter and search logic
  const filteredScans = useMemo(() => {
    if (!stats) return []

    let filtered: ScanItem[] = []

    if (activeTab === 'all') {
      const scanned = (stats.scannedList || []).map((item: Omit<ScanItem, 'status'>) => ({
        ...item,
        status: 'scanned' as const,
      }))
      const pending = (stats.pendingList || []).map((item: Omit<ScanItem, 'status'>) => ({
        ...item,
        status: 'pending' as const,
      }))
      filtered = [...scanned, ...pending]
    } else if (activeTab === 'scanned') {
      filtered = (stats.scannedList || []).map((item: Omit<ScanItem, 'status'>) => ({
        ...item,
        status: 'scanned' as const,
      }))
    } else if (activeTab === 'pending') {
      filtered = (stats.pendingList || []).map((item: Omit<ScanItem, 'status'>) => ({
        ...item,
        status: 'pending' as const,
      }))
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (scan) =>
          scan.userName.toLowerCase().includes(query) ||
          (scan.userEmail && scan.userEmail.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [stats, activeTab, searchQuery])

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link to={eventId ? `/scan/${eventId}` : '/my-events'}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">
            {t('scanStatistics.title', { defaultValue: 'Scan-Statistiken' })}
          </h1>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to={eventId ? `/scan/${eventId}` : '/my-events'}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">
              {t('scanStatistics.title', { defaultValue: 'Scan-Statistiken' })}
            </h1>
            {eventName && (
              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                {eventName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="gradient" size="icon" asChild>
            <Link to={`/scan/${eventId}`}>
              <ScanLine className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card border rounded-lg p-4 border-l-4 border-l-pink-500">
          <Ticket className="h-7 w-7 text-pink-500 mb-2" />
          <p className="text-2xl font-bold">{stats?.totalTickets || 0}</p>
          <p className="text-xs text-muted-foreground">
            {t('scanStatistics.totalTickets', { defaultValue: 'Gesamt' })}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4 border-l-4 border-l-green-500">
          <CheckCircle className="h-7 w-7 text-green-500 mb-2" />
          <p className="text-2xl font-bold">{stats?.scannedTickets || 0}</p>
          <p className="text-xs text-muted-foreground">
            {t('scanStatistics.scanned', { defaultValue: 'Gescannt' })}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4 border-l-4 border-l-orange-500">
          <Clock className="h-7 w-7 text-orange-500 mb-2" />
          <p className="text-2xl font-bold">{stats?.pendingTickets || 0}</p>
          <p className="text-xs text-muted-foreground">
            {t('scanStatistics.pending', { defaultValue: 'Ausstehend' })}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-card border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {t('scanStatistics.progress', { defaultValue: 'Fortschritt' })}
          </span>
          <span className="text-sm font-bold">{stats?.scanPercentage || 0}%</span>
        </div>
        <Progress value={stats?.scanPercentage || 0} className="h-3" />
        <p className="text-xs text-muted-foreground mt-2">
          {t('scanStatistics.progressDetail', {
            scanned: stats?.scannedTickets || 0,
            total: stats?.totalTickets || 0,
            defaultValue: `${stats?.scannedTickets || 0} von ${stats?.totalTickets || 0} gescannt`,
          })}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="all">
            {t('scanStatistics.allTab', { defaultValue: 'Alle' })} (
            {(stats?.scannedTickets || 0) + (stats?.pendingTickets || 0)})
          </TabsTrigger>
          <TabsTrigger value="scanned">
            {t('scanStatistics.scannedTab', { defaultValue: 'Gescannt' })} (
            {stats?.scannedTickets || 0})
          </TabsTrigger>
          <TabsTrigger value="pending">
            {t('scanStatistics.pendingTab', { defaultValue: 'Ausstehend' })} (
            {stats?.pendingTickets || 0})
          </TabsTrigger>
        </TabsList>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {filteredScans.length === 0 ? (
            <div className="text-center py-12">
              <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? t('common.noResults')
                  : t('qrScanner.statistics.noScans')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredScans.map((item, index) => (
                <div
                  key={`${item.ticketId}-${index}`}
                  className="bg-card border rounded-lg p-4 flex items-center gap-4"
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      item.status === 'scanned' ? 'bg-green-100' : 'bg-orange-100'
                    }`}
                  >
                    <User
                      className={`h-5 w-5 ${
                        item.status === 'scanned' ? 'text-green-600' : 'text-orange-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.userName}</p>
                    {item.userEmail && (
                      <p className="text-sm text-muted-foreground truncate">{item.userEmail}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {item.status === 'scanned' && item.scannedAt ? (
                      <div>
                        <p className="text-sm font-medium">
                          {format(new Date(item.scannedAt), 'HH:mm', { locale: de })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.scannedAt), 'dd.MM', { locale: de })}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="text-xs text-orange-600 font-medium">
                          {t('scanStatistics.pending', { defaultValue: 'Ausstehend' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
