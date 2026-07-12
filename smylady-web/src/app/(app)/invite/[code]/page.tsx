import type { Metadata } from 'next'
import InvitePage from '@/views/InvitePage'

interface Props {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const url = `https://shareyourparty.de/invite/${code}`

  return {
    title: 'Du bist eingeladen! Sichere dir 10€ Guthaben — Share Your Party',
    description: 'Registriere dich bei Share Your Party und erhalte 10€ Guthaben für Events und Tickets.',
    alternates: {
      canonical: url,
      languages: { en: `https://shareyourparty.de/en/invite/${code}` },
    },
    openGraph: {
      title: 'Du bist eingeladen zu Share Your Party! 🎉',
      description: 'Registriere dich jetzt und wir bekommen beide 10€ Guthaben.',
      url,
      type: 'website',
      images: [{ url: 'https://shareyourparty.de/logo.png' }],
    },
  }
}

export default async function InviteCodePage({ params }: Props) {
  const { code } = await params
  return <InvitePage code={code} />
}
