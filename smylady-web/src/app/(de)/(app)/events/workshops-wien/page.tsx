import type { Metadata } from 'next'
import WorkshopsWien from '@/views/WorkshopsWien'

// Jahreszahl wie auf der Business-Seite aus dem Datum abgeleitet, siehe dort.
export const revalidate = 86400

export async function generateMetadata(): Promise<Metadata> {
  const year = new Date().getFullYear()

  return {
    // Ohne Brand-Suffix — den hängt das Template im Root-Layout an.
    title: `Workshops Wien ${year} – Kreativ, Business & Wellness`,
    description: `Alle Workshops in Wien ${year} auf einen Blick – Tickets direkt kaufen, Events entdecken ► Jetzt auf Share Your Party!`,
    alternates: {
      canonical: 'https://shareyourparty.de/events/workshops-wien',
    },
  }
}

export default function WorkshopsWienPage() {
  return <WorkshopsWien />
}
