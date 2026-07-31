import type { Metadata } from 'next'
import RaffleTermsPage from '@/views/RaffleTermsPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const url = `https://shareyourparty.de/event/${id}/teilnahmebedingungen`
  const alternates = {
    canonical: url,
    languages: { 'en': `https://shareyourparty.de/en/event/${id}/teilnahmebedingungen` },
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://smylady-backend.onrender.com'
    const res = await fetch(`${apiUrl}/events/public/${id}`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error(`status ${res.status}`)
    const json = await res.json()
    const eventName = json.data?.name

    return {
      title: eventName
        ? `Gewinnspiel-Teilnahmebedingungen: ${eventName} — Share Your Party`
        : 'Gewinnspiel-Teilnahmebedingungen — Share Your Party',
      description: eventName
        ? `Teilnahmebedingungen für das Gewinnspiel zum Event „${eventName}" auf Share Your Party.`
        : 'Teilnahmebedingungen für dieses Gewinnspiel auf Share Your Party.',
      alternates,
    }
  } catch {
    return {
      title: 'Gewinnspiel-Teilnahmebedingungen — Share Your Party',
      description: 'Teilnahmebedingungen für dieses Gewinnspiel auf Share Your Party.',
      alternates,
    }
  }
}

export default async function RaffleTerms({ params }: Props) {
  const { id } = await params
  return <RaffleTermsPage eventSlug={id} />
}
