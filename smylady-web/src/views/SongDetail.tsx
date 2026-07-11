'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SongDetailProps {
  spotifyId: string
}

export default function SongDetail({ spotifyId }: SongDetailProps) {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('common.back', { defaultValue: 'Zurück' })}
        </Button>

        {/* Spotify Embed Player */}
        <div className="rounded-xl overflow-hidden shadow-lg">
          <iframe
            title="Spotify Player"
            src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl"
          />
        </div>

        {/* Spotify attribution + external link */}
        <div className="flex items-center justify-center">
          <a
            href={`https://open.spotify.com/track/${spotifyId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#1DB954] transition-colors"
          >
            <svg className="h-5 w-5 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381C8.64 5.801 15.78 6.061 20.1 8.94c.6.301.72 1.02.42 1.56-.3.42-1.02.6-1.44.18z"/>
            </svg>
            {t('spotify.openInSpotify', { defaultValue: 'Auf Spotify öffnen' })}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
