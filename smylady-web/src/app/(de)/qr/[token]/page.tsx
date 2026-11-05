import type { Metadata } from 'next'
import PromoQrPage from '@/views/PromoQrPage'

/**
 * Ziel des QR-Codes, den Veranstalter auf ihrem Event aufhängen: Rabattcode
 * bzw. Event, ohne Login. Liegt wie /s/[token] außerhalb von (app), damit
 * kein Header erscheint. Die URL baut das Backend (`${FRONTEND_URL}/qr/<token>`),
 * sie steht auf gedruckten Aushängen und muss stabil bleiben.
 */

export const metadata: Metadata = {
  title: 'Dein Rabattcode',
  // Ein Aushang-Link gehört nicht in den Index.
  robots: { index: false, follow: false },
}

export default async function PromoQrRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <PromoQrPage token={token} />
}
