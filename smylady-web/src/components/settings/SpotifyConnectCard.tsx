'use client'

import { Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { spotifyService } from '@/services/spotify'
import { Music, Loader2 } from 'lucide-react'

function SpotifyConnectCardContent() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const { data: spotifyConnected = false, isLoading } = useQuery({
    queryKey: ['spotifyStatus'],
    queryFn: () => spotifyService.getStatus(),
    enabled: isAuthenticated,
    staleTime: 0,
    gcTime: 0,
  })

  const disconnectSpotify = useMutation({
    mutationFn: () => spotifyService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spotifyStatus'] })
      toast({
        title: t('settings.spotifyDisconnected', { defaultValue: 'Spotify getrennt' }),
      })
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description: t('settings.spotifyDisconnectError', { defaultValue: 'Spotify konnte nicht getrennt werden' }),
      })
    },
  })

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.spotify === 'connected') {
        queryClient.invalidateQueries({ queryKey: ['spotifyStatus'] })
        queryClient.refetchQueries({ queryKey: ['spotifyStatus'] })
        toast({
          title: t('settings.spotifyConnected', { defaultValue: 'Spotify verbunden!' }),
        })
      } else if (event.data?.spotify === 'error') {
        toast({
          variant: 'destructive',
          title: t('settings.spotifyError', { defaultValue: 'Spotify-Verbindung fehlgeschlagen' }),
        })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleConnect = async () => {
    try {
      const url = await spotifyService.getConnectUrl()
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:') {
        console.error('Redirect zu unsicherer URL blockiert:', url)
        return
      }

      // Open in popup instead of redirect
      const width = 500
      const height = 700
      const left = window.screenX + (window.innerWidth - width) / 2
      const top = window.screenY + (window.innerHeight - height) / 2
      const popup = window.open(
        parsed.toString(),
        'spotify-auth',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
      )

      // Poll for popup close (Spotify callback closes it)
      const pollTimer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(pollTimer)
          queryClient.invalidateQueries({ queryKey: ['spotifyStatus'] })
          queryClient.refetchQueries({ queryKey: ['spotifyStatus'] })
        }
      }, 500)
    } catch {
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description: t('settings.spotifyConnectError', { defaultValue: 'Spotify konnte nicht verbunden werden' }),
      })
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#1DB954] flex items-center justify-center shrink-0">
              <Music className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Spotify</h3>
              <p className="text-sm text-muted-foreground">
                {spotifyConnected
                  ? t('settings.spotifyLinked', {
                      defaultValue: 'Verbunden — Empfehlungen basieren auf deinem Musikgeschmack',
                    })
                  : t('settings.spotifyNotLinked', {
                      defaultValue: 'Verbinde Spotify für personalisierte Event-Empfehlungen',
                    })}
              </p>
            </div>
          </div>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
          ) : spotifyConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => disconnectSpotify.mutate()}
              disabled={disconnectSpotify.isPending}
            >
              {disconnectSpotify.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('settings.disconnect', { defaultValue: 'Trennen' })}
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-[#1DB954] hover:bg-[#1aa34a] text-white"
              onClick={handleConnect}
            >
              {t('settings.connectSpotify', { defaultValue: 'Verbinden' })}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function SpotifyConnectCard() {
  return (
    <Suspense>
      <SpotifyConnectCardContent />
    </Suspense>
  )
}
