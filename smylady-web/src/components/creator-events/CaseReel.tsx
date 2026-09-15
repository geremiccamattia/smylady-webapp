'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Instagram-Reel einer Case Study.
 *
 * Das Embed wird erst auf Klick geladen. Ein <iframe> je Karte würde sonst beim
 * Seitenaufruf mehrere Instagram-Einbettungen gleichzeitig ziehen — das kostet
 * Ladezeit und setzt bei jedem Besucher Instagram-Cookies, ohne dass er das
 * Reel je ansieht.
 */

interface CaseReelProps {
  shortcode: string
  title: string
}

// Derselbe Verlauf wie auf der übrigen Seite (GRADIENT in views/CreatorEventsPage.tsx).
const GRADIENT = 'bg-gradient-to-br from-[#ff720e] via-[#ff4d3c] to-[#e9548c]'

export default function CaseReel({ shortcode, title }: CaseReelProps) {
  const { t } = useTranslation()
  const [isLoaded, setIsLoaded] = useState(false)

  if (!isLoaded) {
    return (
      <button
        type="button"
        onClick={() => setIsLoaded(true)}
        aria-label={t('influencerEvents.caseReelAria', {
          title,
          defaultValue: 'Reel zu {{title}} laden',
        })}
        className={`group relative flex aspect-[9/16] w-full items-center justify-center overflow-hidden rounded-xl ${GRADIENT}`}
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition group-hover:scale-105">
          <svg viewBox="0 0 24 24" fill="none" className="ml-1 h-7 w-7" aria-hidden="true">
            <path d="M8 5v14l11-7z" fill="#e9548c" />
          </svg>
        </span>
        <span className="absolute bottom-3 left-3 right-3 text-left text-xs font-medium text-white/90">
          {t('influencerEvents.caseReelPlay', { defaultValue: 'Reel ansehen' })}
        </span>
      </button>
    )
  }

  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-black">
      <iframe
        src={`https://www.instagram.com/p/${shortcode}/embed`}
        title={title}
        loading="lazy"
        scrolling="no"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  )
}
