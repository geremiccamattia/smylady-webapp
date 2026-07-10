'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { spotifyService, SpotifyTrack } from '@/services/spotify'
import { Input } from '@/components/ui/input'
import { Music, X } from 'lucide-react'

interface SpotifyTrackSearchProps {
  onSelect: (track: SpotifyTrack) => void
  onClose: () => void
}

export function SpotifyTrackSearch({ onSelect, onClose }: SpotifyTrackSearchProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ['spotifySearch', debouncedQuery],
    queryFn: () => spotifyService.searchTracks(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60 * 1000,
  })

  const formatDuration = (ms: number) => {
    const min = Math.floor(ms / 60000)
    const sec = Math.floor((ms % 60000) / 1000)
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="border rounded-lg bg-background shadow-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-[#1DB954]" />
          <span className="font-medium text-sm">
            {t('spotify.searchSong', { defaultValue: 'Song suchen' })}
          </span>
        </div>
        <button onClick={onClose}>
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="p-3 border-b">
        <Input
          placeholder={t('spotify.searchPlaceholder', { defaultValue: 'Titel oder Künstler...' })}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="h-9"
        />
      </div>

      <div className="max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {t('common.loading', { defaultValue: 'Lädt...' })}
          </div>
        ) : tracks.length > 0 ? (
          tracks.map((track) => (
            <button
              key={track.spotifyId}
              onClick={() => onSelect(track)}
              className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
            >
              {track.albumCoverSmall || track.albumCover ? (
                <img
                  src={track.albumCoverSmall || track.albumCover}
                  alt={track.album}
                  className="h-10 w-10 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <Music className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{track.name}</p>
                <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatDuration(track.durationMs)}
              </span>
            </button>
          ))
        ) : debouncedQuery.length >= 2 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {t('spotify.noResults', { defaultValue: 'Keine Songs gefunden' })}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {t('spotify.typeToSearch', { defaultValue: 'Tippe um zu suchen' })}
          </div>
        )}
      </div>
    </div>
  )
}
