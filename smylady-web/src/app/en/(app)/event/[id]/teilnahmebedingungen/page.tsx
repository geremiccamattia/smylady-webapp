import type { Metadata } from 'next'
import RaffleTermsPage from '@/views/RaffleTermsPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const url = `https://shareyourparty.de/en/event/${id}/teilnahmebedingungen`
  const alternates = {
    canonical: url,
    languages: { 'de': `https://shareyourparty.de/event/${id}/teilnahmebedingungen` },
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://smylady-backend.onrender.com'
    const res = await fetch(`${apiUrl}/events/public/${id}`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error(`status ${res.status}`)
    const json = await res.json()
    const eventName = json.data?.name

    return {
      title: eventName
        ? `Raffle Terms and Conditions: ${eventName} — Share Your Party`
        : 'Raffle Terms and Conditions — Share Your Party',
      description: eventName
        ? `Terms and conditions for the raffle of the event "${eventName}" on Share Your Party.`
        : 'Terms and conditions for this raffle on Share Your Party.',
      alternates,
    }
  } catch {
    return {
      title: 'Raffle Terms and Conditions — Share Your Party',
      description: 'Terms and conditions for this raffle on Share Your Party.',
      alternates,
    }
  }
}

export default async function RaffleTermsEN({ params }: Props) {
  const { id } = await params
  return <RaffleTermsPage eventSlug={id} />
}
