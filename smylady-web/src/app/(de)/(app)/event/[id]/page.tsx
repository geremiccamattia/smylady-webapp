import type { Metadata } from 'next'
import { SITE_URL, localeAlternates } from '@/lib/seo'
import { generateEventSlug } from '@/lib/utils'
import { stripMarkdown } from '@/lib/markdown'
import { buildEventJsonLd, fetchPublicEvent } from '@/lib/eventSchema'
import EventDetailClient from './EventDetailClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

/**
 * Ein openGraph-Objekt auf Seitenebene ERSETZT das aus dem Root-Layout
 * (root-shell.tsx), es wird nicht damit verschmolzen. Ohne diese beiden
 * Felder fehlten auf der Eventseite og:type und og:site_name.
 */
const OG_DEFAULTS = {
  type: 'website' as const,
  siteName: 'Share Your Party',
}

const LOGO_IMAGE = { url: `${SITE_URL}/logo.png` }

/**
 * Greift bei nicht öffentlichen Events — /events/public/:id liefert nur
 * öffentliche — und wenn das Backend gar nicht antwortet. Vorher stand hier
 * nur "Event", was in jeder Link-Vorschau nichtssagend war.
 */
const FALLBACK_TITLE = 'Event auf Share Your Party'
const FALLBACK_DESCRIPTION =
  'Entdecke Events in deiner Nähe, sichere dir Tickets und teile die Momente mit deiner Community.'

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
    // stripMarkdown: die Beschreibung ist Markdown, im Meta-Tag stünden sonst ** und #
    const description = stripMarkdown(event.description).slice(0, 160) || 'Entdecke Events auf Share Your Party'
    const image = event.locationImages?.[0]?.url || event.thumbnailUrl || ''
    const url = `${SITE_URL}/event/${generateEventSlug(event.name, event._id || id)}`

    return {
      title,
      description,
      alternates: localeAlternates(`/event/${generateEventSlug(event.name, event._id || id)}`, 'de'),
      openGraph: {
        ...OG_DEFAULTS,
        title: `${title} | Share Your Party`,
        description,
        url,
        // Ohne Eventbild das Logo: ein leeres images-Array verdrängt auch den
        // Rückfall aus dem Root-Layout, die Vorschau bliebe dann ganz ohne Bild.
        images: image ? [{ url: image }] : [LOGO_IMAGE],
      },
    }
  } catch (error) {
    console.error('[generateMetadata] failed:', error)
    return FALLBACK_METADATA
  }
}

export default async function EventPage({ params }: Props) {
  const { id } = await params
  // Serverseitig ausgegeben, nicht per useEffect: Google rendert JavaScript,
  // die meisten KI-Crawler nicht.
  const event = await fetchPublicEvent(id)
  const jsonLd = event ? buildEventJsonLd(event, 'de', id) : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <EventDetailClient id={id} />
    </>
  )
}
