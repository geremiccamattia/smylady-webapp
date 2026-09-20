import type { Metadata } from 'next'
import WorkshopsWien from '@/views/WorkshopsWien'

// Year derived from the date, same approach as the business events page.
export const revalidate = 86400

export async function generateMetadata(): Promise<Metadata> {
  const year = new Date().getFullYear()

  return {
    // Without the brand suffix — the root layout template appends it.
    title: `Workshops Vienna ${year} – Creative, Business & Wellness`,
    description: `All workshops in Vienna ${year} at a glance – buy tickets directly, discover events ► Now on Share Your Party!`,
    alternates: {
      canonical: 'https://shareyourparty.de/en/events/workshops-wien',
    },
  }
}

export default function WorkshopsWienEnPage() {
  return <WorkshopsWien />
}
