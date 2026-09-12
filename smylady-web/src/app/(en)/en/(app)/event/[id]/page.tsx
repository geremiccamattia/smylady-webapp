import type { Metadata } from 'next'
import { SITE_URL, localeAlternates } from '@/lib/seo'
import { generateEventSlug } from '@/lib/utils'
import { stripMarkdown } from '@/lib/markdown'
import EventDetailClient from '@/app/(de)/(app)/event/[id]/EventDetailClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

/**
 * A page-level openGraph object REPLACES the one from the root layout
 * (root-shell.tsx), it is not merged with it. Without these two fields the
 * event page was missing og:type and og:site_name.
 */
const OG_DEFAULTS = {
  type: 'website' as const,
  siteName: 'Share Your Party',
}

const LOGO_IMAGE = { url: `${SITE_URL}/logo.png` }

/**
 * Used for non-public events — /events/public/:id only returns public ones —
 * and when the backend does not answer at all. This used to be just "Event",
 * which said nothing in a link preview.
 */
const FALLBACK_TITLE = 'Event on Share Your Party'
const FALLBACK_DESCRIPTION =
  'Discover events near you, grab tickets and share the moments with your community.'

const FALLBACK_METADATA: Metadata = {
  title: FALLBACK_TITLE,
  description: FALLBACK_DESCRIPTION,
  openGraph: {
    ...OG_DEFAULTS,
    title: FALLBACK_TITLE,
    description: FALLBACK_DESCRIPTION,
    images: [LOGO_IMAGE],
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://smylady-backend.onrender.com'
    const res = await fetch(`${apiUrl}/events/public/${id}?populateCreator=true`, {
      next: { revalidate: 60 }
    })
    if (!res.ok) return FALLBACK_METADATA
    const json = await res.json()
    const event = json.data
    const title = event.name
    // stripMarkdown: the description is Markdown, otherwise ** and # end up in the meta tag
    const description = stripMarkdown(event.description).slice(0, 160) || 'Discover events on Share Your Party'
    const image = event.locationImages?.[0]?.url || event.thumbnailUrl || ''
    const slug = generateEventSlug(event.name, event._id || id)
    const url = `${SITE_URL}/en/event/${slug}`

    return {
      title,
      description,
      alternates: localeAlternates(`/event/${slug}`, 'en'),
      openGraph: {
        ...OG_DEFAULTS,
        title: `${title} | Share Your Party`,
        description,
        url,
        // Without an event image use the logo: an empty images array also
        // drops the fallback from the root layout, leaving no preview image.
        images: image ? [{ url: image }] : [LOGO_IMAGE],
      },
    }
  } catch {
    return FALLBACK_METADATA
  }
}

export default async function EventPageEN({ params }: Props) {
  const { id } = await params
  return <EventDetailClient id={id} />
}
