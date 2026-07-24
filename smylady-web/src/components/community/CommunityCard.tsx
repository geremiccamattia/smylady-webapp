'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { useLocalePath } from '@/hooks/useLocalePath'
import { resolveImageUrl, generateCommunitySlug } from '@/lib/utils'
import { EVENT_CATEGORIES } from '@/lib/constants'

interface CommunityCardProps {
  community: {
    _id: string
    name: string
    description: string
    category?: string
    categories?: string[]
    coverImages?: { url: string }[]
    memberCount: number
    creatorId?: { name: string; profileImage?: string }
  }
}

export const categoryEmojis: Record<string, string> = {
  Music: '🎵', Clubbing: '🎶', Business: '💼', Nature: '🌿',
  Theme: '🎭', Sports: '⚽', Workshop: '🛠', Gastronomy: '🍽',
  Yoga: '🧘', 'On the Roof': '🏙', Other: '🎉',
}

export const categoryColors: Record<string, string> = {
  Music: '#FFF0F6', Clubbing: '#F5F0FF', Business: '#F0F4FF',
  Nature: '#F0FFF4', Theme: '#FFFBF0', Sports: '#FFF0F0',
  Workshop: '#F0FFFF', Gastronomy: '#FFF8F0', Yoga: '#F5FFF0',
  'On the Roof': '#F0F8FF', Other: '#F5F5F5',
}

export default function CommunityCard({ community }: CommunityCardProps) {
  const { t } = useTranslation()
  const localePath = useLocalePath()

  const coverUrl = community.coverImages?.[0]?.url ? resolveImageUrl(community.coverImages[0].url) : null
  const categories = (community.categories && community.categories.length > 0
    ? community.categories
    : [community.category]
  ).filter((c): c is string => !!c)
  const primaryCategory = categories[0] || 'Other'
  const emoji = categoryEmojis[primaryCategory] || '🎉'
  const bgColor = categoryColors[primaryCategory] || '#F5F5F5'

  return (
    <Link href={localePath(`/communities/${generateCommunitySlug(community.name, community._id)}`)}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={community.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-5xl"
              style={{ backgroundColor: bgColor }}
            >
              {emoji}
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
            {community.name}
          </h3>

          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <span key={cat} className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-medium">
                {t(`categories.${cat}`, { defaultValue: EVENT_CATEGORIES.find((c) => c.value === cat)?.label || cat })}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{community.memberCount} {t('community.members', { defaultValue: 'Mitglieder' })}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
