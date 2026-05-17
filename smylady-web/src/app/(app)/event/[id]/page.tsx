import type { Metadata } from 'next'
import { generateEventSlug } from '@/lib/utils'
import EventDetailClient from './EventDetailClient'

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
    const description = event.description?.slice(0, 160) ?? 'Entdecke Events auf Share Your Party'
    const image = event.locationImages?.[0]?.url || event.thumbnailUrl || ''
    const url = `https://shareyourparty.de/event/${generateEventSlug(event.name, event._id || id)}`

    return {
      title,
      description,
      alternates: {
        canonical: url,
        languages: { 'en': `https://shareyourparty.de/en/event/${generateEventSlug(event.name, event._id || id)}` }
      },
      openGraph: {
        title: `${title} | Share Your Party`,
        description,
        url,
        images: image ? [{ url: image }] : [],
      },
    }
  } catch (error) {
    console.error('[generateMetadata] failed:', error)
    return { title: 'Event' }
  }
}

export default async function EventPage({ params }: Props) {
  const { id } = await params
  return <EventDetailClient id={id} />
}
