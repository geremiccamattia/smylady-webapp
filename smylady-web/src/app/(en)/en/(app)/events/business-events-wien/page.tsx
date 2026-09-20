import type { Metadata } from 'next'
import BusinessEventsWien from '@/views/BusinessEventsWien'
import JsonLd from '@/components/seo/JsonLd'
import { fetchBusinessEventsWien } from '@/lib/businessEventsWien'
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildItemListSchema,
} from '@/lib/businessEventsSchema'

/*
 * The year in the title is no longer hardcoded. generateMetadata runs when the
 * page is produced, and `revalidate` makes that happen without a deploy — so the
 * new year appears by itself.
 *
 * The event fetch carries revalidate 3600; Next takes the smaller value for the
 * route, so the page refreshes hourly.
 */
export const revalidate = 86400

export async function generateMetadata(): Promise<Metadata> {
  const year = new Date().getFullYear()

  return {
    /*
     * WITHOUT " | Share Your Party": the brand is appended by the template in
     * the root layout (src/app/(en)/layout.tsx). Keeping it here as well made it
     * show up twice in the delivered title.
     */
    title: `Business & Networking Events in Vienna ${year}`,
    description:
      'Business and networking events in Vienna: business breakfasts, afterwork, speed networking, meetups and conferences. Updated continuously.',
    alternates: {
      canonical: 'https://shareyourparty.de/en/events/business-events-wien',
    },
  }
}

export default async function BusinessEventsWienEnPage() {
  // Fetched on the server so the structured data lands in the initial HTML.
  // The view keeps its own client query — it is interactive and should stay
  // current after load. Both use the same query parameters.
  const events = await fetchBusinessEventsWien()
  const itemList = buildItemListSchema(events, 'en')

  return (
    <>
      <JsonLd data={buildBreadcrumbSchema('en')} />
      <JsonLd data={buildFaqSchema('en')} />
      {itemList && <JsonLd data={itemList} />}
      <BusinessEventsWien />
    </>
  )
}
