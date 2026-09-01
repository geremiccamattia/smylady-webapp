import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/seo'
import InvitePage from '@/views/InvitePage'

interface Props {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const url = `https://shareyourparty.de/invite/${code}`

  return {
    title: 'Du bist eingeladen! Sichere dir 20€ Guthaben — Share Your Party',
    description: 'Registriere dich bei Share Your Party und erhalte 20€ Guthaben für Events und Tickets.',
    alternates: localeAlternates(`/invite/${code}`, 'de'),
    openGraph: {
      title: 'Du bist eingeladen zu Share Your Party! 🎉',
      description: 'Registriere dich jetzt und wir bekommen beide 20€ Guthaben.',
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
