'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  ScanLine,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { eventsService, type ScanTokenSummary, type EventScanner } from '@/services/events'
import { userService } from '@/services/user'
import { useAuth } from '@/contexts/AuthContext'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useToast } from '@/hooks/use-toast'
import { useLocalePath } from '@/hooks/useLocalePath'
import { resolveThumbnailUrl } from '@/lib/utils'
import { SITE_URL } from '@/lib/seo'

/**
 * Verwaltung der Scan-Berechtigungen eines Events.
 *
 * Zwei Wege, Tickets scannen zu lassen:
 *  - Zugangslink: funktioniert ohne Konto, für Fremdpersonal am Eingang
 *  - Eingetragene Person: scannt über ihr eigenes Konto in der App
 *
 * Nur für Eigentümer und Admin — die Prüfung läuft über dieselbe Ableitung wie
 * auf der Event-Detailseite (creator bzw. userId, string oder populiertes Objekt).
 */
export default function ScanAccessManagement() {
  const { eventId } = useParams<{ eventId: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const isAdmin = useIsAdmin()
  const { toast } = useToast()
  const localePath = useLocalePath()
  const queryClient = useQueryClient()

  const [label, setLabel] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [freshLink, setFreshLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsService.getEventById(eventId!),
    enabled: !!eventId,
  })

  // Gleiche Ableitung wie in EventDetailClient: das Backend liefert userId bzw.
  // creator mal als String, mal als populiertes Objekt.
  const creatorData = event?.creator || event?.userId
  const creatorId = creatorData
    ? typeof creatorData === 'string'
      ? creatorData
      : (creatorData as any)._id || (creatorData as any).id || null
    : null
  const currentUserId = user ? user._id || user.id : null
  const isOwner = !!(currentUserId && creatorId && currentUserId === creatorId)
  const mayManage = isOwner || isAdmin

  const { data: tokens = [], isLoading: tokensLoading } = useQuery({
    queryKey: ['scanTokens', eventId],
    queryFn: () => eventsService.listScanTokens(eventId!),
    enabled: !!eventId && mayManage,
  })

  const { data: scanners = [], isLoading: scannersLoading } = useQuery({
    queryKey: ['eventScanners', eventId],
    queryFn: () => eventsService.listScanners(eventId!),
    enabled: !!eventId && mayManage,
  })

  const createToken = useMutation({
    mutationFn: () =>
      eventsService.createScanToken(eventId!, {
        label: label.trim(),
        // Ohne Angabe entscheidet das Backend (Standard: 24 Stunden).
        ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
      }),
    onSuccess: (created) => {
      setFreshLink(`${SITE_URL}/s/${created.token}`)
      setCopied(false)
      setLabel('')
      setExpiresAt('')
      queryClient.invalidateQueries({ queryKey: ['scanTokens', eventId] })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: error?.response?.data?.message || 'Zugang konnte nicht erstellt werden.',
      })
    },
  })

  const revokeToken = useMutation({
    mutationFn: (tokenId: string) => eventsService.revokeScanToken(eventId!, tokenId),
    onSuccess: () => {
      toast({ title: 'Zugang widerrufen' })
      queryClient.invalidateQueries({ queryKey: ['scanTokens', eventId] })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: error?.response?.data?.message || 'Zugang konnte nicht widerrufen werden.',
      })
    },
  })

  const addScanner = useMutation({
    mutationFn: (userId: string) => eventsService.addScanner(eventId!, userId),
    onSuccess: () => {
      toast({ title: 'Scanner hinzugefügt' })
      setSearch('')
      setSearchResults([])
      queryClient.invalidateQueries({ queryKey: ['eventScanners', eventId] })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: error?.response?.data?.message || 'Person konnte nicht hinzugefügt werden.',
      })
    },
  })

  const removeScanner = useMutation({
    mutationFn: (userId: string) => eventsService.removeScanner(eventId!, userId),
    onSuccess: () => {
      toast({ title: 'Scanner entfernt' })
      queryClient.invalidateQueries({ queryKey: ['eventScanners', eventId] })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: error?.response?.data?.message || 'Person konnte nicht entfernt werden.',
      })
    },
  })

  const runSearch = async (q: string) => {
    setSearch(q)
    if (q.trim().length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const results = await userService.searchUsers(q.trim())
      // Bereits eingetragene Personen nicht erneut anbieten.
      const existing = new Set(scanners.map((s: EventScanner) => s.id))
      setSearchResults(results.filter((u: any) => !existing.has(u._id || u.id)))
    } finally {
      setSearching(false)
    }
  }

  const copyLink = async () => {
    if (!freshLink) return
    try {
      await navigator.clipboard.writeText(freshLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        variant: 'destructive',
        title: 'Kopieren fehlgeschlagen',
        description: 'Bitte den Link von Hand markieren und kopieren.',
      })
    }
  }

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!mayManage) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">Kein Zugriff</h1>
        <p className="text-muted-foreground">
          Scan-Berechtigungen kann nur der Veranstalter des Events verwalten.
        </p>
      </div>
    )
  }

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const statusLabel: Record<ScanTokenSummary['status'], string> = {
    active: 'Aktiv',
    expired: 'Abgelaufen',
    revoked: 'Widerrufen',
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <Button variant="ghost" className="gap-2 -ml-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Scan-Berechtigungen</h1>
        <p className="text-muted-foreground mt-1">{event?.name}</p>
      </div>

      {/* Schritt 4 — der Unterschied in zwei Sätzen */}
      <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground leading-relaxed">
        Ein <strong className="text-foreground">Zugangslink</strong> funktioniert ohne Konto
        und ohne App — wer ihn öffnet, kann sofort Tickets scannen. Eine{' '}
        <strong className="text-foreground">eingetragene Person</strong> scannt dagegen über
        ihr eigenes Konto in der App.
      </div>

      {/* ── Zugangslinks ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Zugangslinks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Frisch erzeugter Link — nur jetzt sichtbar */}
          {freshLink && (
            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Diesen Link jetzt kopieren — er wird nie wieder angezeigt.
              </p>
              <p className="break-all font-mono text-xs bg-background rounded p-2 border">
                {freshLink}
              </p>
              <Button onClick={copyLink} className="w-full gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Kopiert' : 'Link kopieren'}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setFreshLink(null)}
              >
                Ausblenden
              </Button>
            </div>
          )}

          {/* Anlegen */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="scanLabel">Bezeichnung</Label>
              <Input
                id="scanLabel"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="z.B. Security Eingang Nord"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scanExpiry">Gültig bis (optional)</Label>
              <Input
                id="scanExpiry"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ohne Angabe gilt der Link 24 Stunden.
              </p>
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => createToken.mutate()}
              disabled={!label.trim() || createToken.isPending}
            >
              {createToken.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Zugangslink erstellen
            </Button>
          </div>

          {/* Bestehende Zugänge */}
          <div className="pt-2 border-t space-y-2">
            {tokensLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : tokens.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Noch keine Zugangslinks erstellt.
              </p>
            ) : (
              tokens.map((token: ScanTokenSummary) => {
                const inactive = token.status !== 'active'
                return (
                  <div
                    key={token.id}
                    className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${
                      inactive ? 'opacity-60 bg-muted/40' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{token.label}</p>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            token.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {statusLabel[token.status]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Gültig bis {formatDateTime(token.expiresAt)} Uhr
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {token.scannedTickets}{' '}
                        {token.scannedTickets === 1 ? 'Ticket' : 'Tickets'} gescannt
                      </p>
                    </div>
                    {token.status === 'active' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 shrink-0"
                        disabled={revokeToken.isPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Zugang „${token.label}“ widerrufen? Der Link funktioniert danach sofort nicht mehr.`,
                            )
                          ) {
                            revokeToken.mutate(token.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Scanner-Personen ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Personen mit Scan-Recht
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scannerSearch">Person suchen</Label>
            <Input
              id="scannerSearch"
              value={search}
              onChange={(e) => runSearch(e.target.value)}
              placeholder="Name oder Username"
            />
            {searching && (
              <p className="text-xs text-muted-foreground">Suche läuft…</p>
            )}
            {searchResults.length > 0 && (
              <div className="rounded-lg border divide-y">
                {searchResults.slice(0, 6).map((u: any) => {
                  const uid = u._id || u.id
                  return (
                    <div key={uid} className="flex items-center gap-3 p-2">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={resolveThumbnailUrl(u.profileImage) || ''} />
                        <AvatarFallback>
                          {u.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        {u.username && (
                          <p className="text-xs text-muted-foreground truncate">
                            @{u.username}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="gap-1.5 shrink-0"
                        disabled={addScanner.isPending}
                        onClick={() => addScanner.mutate(uid)}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Hinzufügen
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="pt-2 border-t space-y-2">
            {scannersLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : scanners.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Noch niemand eingetragen.
              </p>
            ) : (
              scanners.map((scanner: EventScanner) => (
                <div
                  key={scanner.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={
                        resolveThumbnailUrl({
                          url: scanner.profileImage,
                          thumbnailUrl: scanner.profileImageThumbnailUrl,
                        }) || ''
                      }
                    />
                    <AvatarFallback>
                      {scanner.name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{scanner.name}</p>
                    {scanner.username && (
                      <p className="text-sm text-muted-foreground truncate">
                        @{scanner.username}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 shrink-0"
                    disabled={removeScanner.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          `${scanner.name} das Scan-Recht entziehen?`,
                        )
                      ) {
                        removeScanner.mutate(scanner.id)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full gap-2" asChild>
        <Link href={localePath(`/scan/${eventId}`)}>
          <ScanLine className="h-4 w-4" />
          Selbst scannen
        </Link>
      </Button>
    </div>
  )
}
