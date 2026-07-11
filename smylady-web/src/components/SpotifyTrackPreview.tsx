'use client'

import { useState } from 'react'
import { Music, X } from 'lucide-react'

interface SpotifyTrackPreviewProps {
  track: {
    spotifyId?: string
    name: string
    artist: string
    album?: string
    albumCover?: string
    spotifyUrl: string
    previewUrl?: string
  }
  compact?: boolean
}

export function SpotifyTrackPreview({ track, compact = false }: SpotifyTrackPreviewProps) {
  const [showPlayer, setShowPlayer] = useState(false)

  const spotifyId = track.spotifyId ||
    track.spotifyUrl?.match(/track\/([a-zA-Z0-9]+)/)?.[1] || ''

  console.log('=== SPOTIFY DEBUG ===', {
    spotifyId,
    trackSpotifyId: track.spotifyId,
    spotifyUrl: track.spotifyUrl,
    showPlayer,
    allKeys: Object.keys(track),
  })

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Track info bar */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          if (spotifyId) setShowPlayer(!showPlayer)
        }}
        className={`flex items-center gap-3 w-full text-left hover:bg-muted/50 transition-colors ${
          compact ? 'p-2' : 'p-3'
        }`}
      >
        {track.albumCover ? (
          <img
            src={track.albumCover}
            alt={track.album || track.name}
            className={`rounded object-cover flex-shrink-0 ${compact ? 'h-10 w-10' : 'h-12 w-12'}`}
          />
        ) : (
          <div className={`rounded bg-[#1DB954] flex items-center justify-center flex-shrink-0 ${compact ? 'h-10 w-10' : 'h-12 w-12'}`}>
            <Music className="h-5 w-5 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate ${compact ? 'text-xs' : 'text-sm'}`}>
            {track.name}
          </p>
          <p className={`text-muted-foreground truncate ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {track.artist}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {showPlayer ? (
            <X className="h-4 w-4 text-muted-foreground" />
          ) : (
            <>
              <svg className={compact ? 'h-4 w-4' : 'h-5 w-5'} viewBox="0 0 24 24" fill="#1DB954">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381C8.64 5.801 15.78 6.061 20.1 8.94c.6.301.72 1.02.42 1.56-.3.42-1.02.6-1.44.18z"/>
              </svg>
              <span className="text-[#1DB954] text-lg">▶</span>
            </>
          )}
        </div>
      </button>

      {/* Inline Spotify Embed Player */}
      {showPlayer && spotifyId && (
        <div className="border-t">
          <iframe
            title="Spotify Player"
            src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      )}
    </div>
  )
}
