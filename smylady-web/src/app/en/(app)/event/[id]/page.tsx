import type { Metadata } from 'next'
import { generateEventSlug } from '@/lib/utils'
import { stripMarkdown } from '@/lib/markdown'
import EventDetailClient from '@/app/(app)/event/[id]/EventDetailClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://smylady-backend.onrender.com'
    const res = await fetch(`${apiUrl}/events/public/${id}?populateCreator=true`, {
      next: { revalidate: 60 }
    })
    if (!res.ok) return { title: 'Event' }
    const json = await res.json()
    const event = json.data
    const title = event.name
    // stripMarkdown: the description is Markdown, otherwise ** and # end up in the meta tag
    const description = stripMarkdown(event.description).slice(0, 160) || 'Discover events on Share Your Party'
    const image = event.locationImages?.[0]?.url || event.thumbnailUrl || ''
    const slug = generateEventSlug(event.name, event._id || id)
    const url = `https://shareyourparty.de/en/event/${slug}`

    return {
      title,
      description,
      alternates: {
        canonical: url,
        languages: { 'de': `https://shareyourparty.de/event/${slug}` }
      },
      openGraph: {
        title: `${title} | Share Your Party`,
        description,
        url,
        images: image ? [{ url: image }] : [],
      },
    }
  } catch {
    return { title: 'Event' }
  }
}

export default async function EventPageEN({ params }: Props) {
  const { id } = await params
  return <EventDetailClient id={id} />
}
