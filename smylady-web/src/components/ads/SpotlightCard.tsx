'use client'

import { useEffect } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'
import { resolveImageUrl } from '@/lib/utils'
import { safeExternalUrl } from '@/lib/safeUrl'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { CONFIG } from '@/lib/constants'

interface SpotlightAd {
  _id: string
  headline: string
  description: string
  headlineEn?: string
  descriptionEn?: string
  imageUrl: string
  targetUrl: string
  locationLabel?: string
  categoryLabel?: string
}

interface SpotlightCardProps {
  ad: SpotlightAd
}

export function SpotlightCard({ ad }: SpotlightCardProps) {
  const { t, i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')

  useEffect(() => {
    axios.post(`${CONFIG.API_URL}/spotlight/${ad._id}/impression`).catch(() => {})
  }, [ad._id])

  const headline = (isEnglish && ad.headlineEn) ? ad.headlineEn : ad.headline
  const description = (isEnglish && ad.descriptionEn) ? ad.descriptionEn : ad.description

  // targetUrl wird vom Werbekunden frei eingetragen — ohne Prüfung wäre das ein
  // Skript-Sink auf der Explore-Seite, also vor jedem Besucher.
  const targetUrl = safeExternalUrl(ad.targetUrl)

  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-sm border flex flex-col">
      {/* Image mit ANZEIGE-Badge */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        <img
          src={resolveImageUrl(ad.imageUrl)}
          alt={ad.headline}
          className="w-full h-full object-cover"
        />
        <span className="absolute top-3 left-3 text-xs font-semibold tracking-widest uppercase bg-black/60 text-white px-2 py-1 rounded">
          {t('spotlight.adBadge', { defaultValue: 'Anzeige' })}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Category pill */}
        {ad.categoryLabel && (
          <span className="self-start text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
            {ad.categoryLabel}
          </span>
        )}

        {/* Headline */}
        <h3 className="font-bold text-base leading-snug">{headline}</h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>

        {/* Location */}
        {ad.locationLabel && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">{ad.locationLabel}</span>
          </div>
        )}

        {/* Gesponsert label + CTA */}
        <div className="mt-auto pt-2 flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">{t('spotlight.sponsored', { defaultValue: 'Gesponsert' })}</span>
          {targetUrl && (
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-foreground text-background text-sm font-semibold py-2.5 px-4 rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('spotlight.visitWebsite', { defaultValue: 'Website besuchen' })}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
