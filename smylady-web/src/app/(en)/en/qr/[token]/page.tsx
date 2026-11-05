import type { Metadata } from 'next'
import PromoQrPage from '@/views/PromoQrPage'

/** Englische Fassung von /qr/[token] (proxy.ts leitet EN-Nutzer auf /en/… um). */

export const metadata: Metadata = {
  title: 'Your discount code',
  robots: { index: false, follow: false },
}

export default async function PromoQrRouteEN({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <PromoQrPage token={token} />
}
