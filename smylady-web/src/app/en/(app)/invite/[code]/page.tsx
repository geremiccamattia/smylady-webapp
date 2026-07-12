import type { Metadata } from 'next'
import InvitePage from '@/views/InvitePage'

interface Props {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const url = `https://shareyourparty.de/en/invite/${code}`

  return {
    title: "You're invited! Get €20 credit — Share Your Party",
    description: 'Sign up on Share Your Party and get €20 credit for events and tickets.',
    alternates: {
      canonical: url,
      languages: { de: `https://shareyourparty.de/invite/${code}` },
    },
    openGraph: {
      title: "You're invited to Share Your Party! 🎉",
      description: 'Sign up now and we both get €20 credit.',
      url,
      type: 'website',
      images: [{ url: 'https://shareyourparty.de/logo.png' }],
    },
  }
}

export default async function InviteCodePageEN({ params }: Props) {
  const { code } = await params
  return <InvitePage code={code} />
}
