'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useLocalePath } from '@/hooks/useLocalePath'
import { communityService } from '@/services/community'
import { EVENT_CATEGORIES } from '@/lib/constants'
import CommunityCard from './CommunityCard'

// Same categories as events, in the display order requested for the community chips
const CATEGORY_ORDER = [
  'Music', 'Clubbing', 'Business', 'Nature', 'Sports',
  'Workshop', 'Gastronomy', 'Yoga', 'Theme', 'On the Roof', 'Other',
]
const COMMUNITY_CATEGORIES = CATEGORY_ORDER
  .map((value) => EVENT_CATEGORIES.find((c) => c.value === value))
  .filter((c): c is typeof EVENT_CATEGORIES[number] => !!c)

export default function CommunityExplore() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const localePath = useLocalePath()

  const [selectedCategory, setSelectedCategory] = useState('all')

  const activeCategory = selectedCategory !== 'all' ? selectedCategory : undefined

  // My Communities (only relevant when authenticated)
  const { data: myCommunities = [] } = useQuery({
    queryKey: ['communities', 'my-communities'],
    queryFn: communityService.getMyCommunities,
    enabled: isAuthenticated,
  })

  // Top Picks
  const { data: topPicks = [], isLoading: isLoadingTopPicks } = useQuery({
    queryKey: ['communities', 'top-picks'],
    queryFn: () => communityService.getTopPicks(3),
  })

  // Category preview grid (only when a category chip is active)
  const { data: categoryPreview = [], isLoading: isLoadingCategoryPreview } = useQuery({
    queryKey: ['communities', 'category-preview', activeCategory],
    queryFn: () => communityService.getAll(activeCategory, undefined, 1, 3),
    enabled: !!activeCategory,
    select: (data) => data?.communities || [],
  })

  // All communities (paginated)
  const {
    data: allCommunitiesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingAll,
  } = useInfiniteQuery({
    queryKey: ['communities', 'list', activeCategory],
    queryFn: ({ pageParam = 1 }) =>
      communityService.getAll(activeCategory, undefined, pageParam, 20),
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined
      const loaded = lastPage.page * lastPage.limit
      return loaded < lastPage.total ? lastPage.page + 1 : undefined
    },
    initialPageParam: 1,
  })

  const allCommunities = allCommunitiesData?.pages.flatMap((page) => page?.communities || []) || []

  const categoryLabel = (value: string) => {
    const cat = COMMUNITY_CATEGORIES.find((c) => c.value === value)
    return t(`categories.${value}`, { defaultValue: cat?.label || value })
  }

  return (
    <div className="space-y-6">
      {/* Create Community */}
      <div className="flex justify-center mb-6">
        <Link href={localePath('/communities/create')}>
          <Button variant="gradient" className="px-8">
            {t('community.createCommunity', { defaultValue: 'Community erstellen' })}
          </Button>
        </Link>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-primary text-white'
              : 'bg-muted hover:bg-muted/80 text-foreground'
          }`}
        >
          {t('community.all', { defaultValue: 'Alle' })}
        </button>
        {COMMUNITY_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(selectedCategory === cat.value ? 'all' : cat.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              selectedCategory === cat.value
                ? 'bg-primary text-white'
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
          >
            {categoryLabel(cat.value)}
          </button>
        ))}
      </div>

      {/* My Communities */}
      {isAuthenticated && myCommunities.length > 0 && !activeCategory && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight">
            {t('community.myCommunities', { defaultValue: 'Meine Communities' })}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {myCommunities.map((community: any) => (
              <div key={community._id} className="flex-shrink-0 w-56">
                <CommunityCard community={community} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Pick */}
      {!activeCategory && (topPicks.length > 0 || isLoadingTopPicks) && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight">
            🔥 {t('community.topPick', { defaultValue: 'Top Pick' })}
          </h2>
          {isLoadingTopPicks ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl bg-muted animate-pulse aspect-[4/3]" />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible">
              {topPicks.map((community: any) => (
                <div key={community._id} className="flex-shrink-0 w-[70vw] md:w-auto">
                  <CommunityCard community={community} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category preview */}
      {activeCategory && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight">
            {categoryLabel(activeCategory)} {t('community.title', { defaultValue: 'Communities' })}
          </h2>
          {isLoadingCategoryPreview ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl bg-muted animate-pulse aspect-[4/3]" />
              ))}
            </div>
          ) : categoryPreview.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categoryPreview.map((community: any) => (
                <CommunityCard key={community._id} community={community} />
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* All Communities */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight">
          {t('community.allCommunities', { defaultValue: 'Alle Communities' })}
        </h2>
        {isLoadingAll ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl bg-muted animate-pulse aspect-[4/3]" />
            ))}
          </div>
        ) : allCommunities.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allCommunities.map((community: any) => (
                <CommunityCard key={community._id} community={community} />
              ))}
            </div>
            {hasNextPage && (
              <div className="flex justify-center py-4">
                <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('common.loading', { defaultValue: 'Lädt...' })}
                    </>
                  ) : (
                    t('common.loadMore', { defaultValue: 'Mehr laden' })
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            {t('community.noCommunities', { defaultValue: 'Noch keine Communities vorhanden.' })}
          </p>
        )}
      </div>
    </div>
  )
}
