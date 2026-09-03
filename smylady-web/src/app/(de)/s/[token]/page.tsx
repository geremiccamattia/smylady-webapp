import type { Metadata } from 'next'
import ScanAccessPage from '@/views/ScanAccessPage'

/**
 * Öffentlicher Scan-Zugang für Einlasspersonal ohne Konto.
 *
 * Pfad bewusst /s/[token] und nicht /scan/[token]: Unter /scan liegt bereits
 * /scan/[eventId] (der Scanner für angemeldete Veranstalter). Zwei verschiedene
 * dynamische Segmentnamen auf derselben Ebene lehnt Next.js ab. Kurz ist hier
 * ohnehin von Vorteil — der Link wird per Nachricht weitergegeben.
 *
 * Liegt ausserhalb von (app), damit kein Header und keine Navigation erscheinen.
 */

export const metadata: Metadata = {
  title: 'Ticket-Scan',
  // Ein Zugangslink gehört nicht in den Index.
  robots: { index: false, follow: false },
}

export default async function ScanAccessRoute({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <ScanAccessPage token={token} />
}
